import "reflect-metadata";
import { DynamoDBStreamEvent } from "aws-lambda";
import { StationsContent, StationsStates, StationState, StationStateChange, ActivityStatus, StationMedianUsage, MedianUsage, StationsUsageStatistics } from "../common/domain";
import { extractDynamoEvent } from "../common/dynamoEventExtractor";
import { deltaMinutes, deltaSeconds, toParisDay } from "../common/dateUtil";
import { getStationsStates, updateStationsStates } from "../common/repository/stationsStatesRepository";
import { saveStationStateChange } from "../common/repository/stationsStatesChangesRepository";
import { getMedianUsage } from "../common/repository/medianUsageRepository";
import { getStationUsageStats } from "../common/repository/stationUsageStatsDynamoRepository";

const coldThresholdMinutesMin: number = +process.env.COLD_THRESHOLD_MINUTES_MIN;
const lockedActivityThreshold: number = +process.env.LOCKED_ACTIVITY_THRESHOLD;
const unlockedActivityThreshold: number = +process.env.UNLOCKED_ACTIVITY_THRESHOLD;
const globalRatioMin: number = +process.env.GLOBAL_RATIO_MIN;
const globalRatioMax: number = +process.env.GLOBAL_RATIO_MAX;

export const lambdaHandler = async (event: DynamoDBStreamEvent) => {
    let currentStationsContent = extractDynamoEvent(StationsContent, event);
    if(!currentStationsContent.fetchDateTime){
        console.error("No fetchDateTime in event, pass");
        return;
    }

    //compute median usage on past 30 minutes ?
    let [medianUsagesForPast30, usagesForPast30, oldStates] = await Promise
        .all([getMedianUsageForPast30Minutes(currentStationsContent.fetchDateTime), getUsageForPast30Minutes(currentStationsContent.fetchDateTime), getStationsStates()]);

    
    console.log("mergeMedianUsages");
    let medianUsages = mergeMedianUsages(medianUsagesForPast30);
    console.log("mergeUsages");
    let usages = mergeUsages(usagesForPast30);

    if (oldStates === undefined) { //special case for first run
        oldStates = new StationsStates();
        oldStates.fetchDateTime = currentStationsContent.fetchDateTime;
    }

    console.log("computeGlobalUsageRatio");
    let globalUsageRatio = computeGlobalUsageRatio(medianUsages, usages);
    console.log("global usage ratio : "+globalUsageRatio);

    let newStates = initStatesFromContent(currentStationsContent);
    computeMissingActivities(newStates, oldStates, medianUsages, globalUsageRatio);
    accrueActivitiesSinceLocked(newStates, oldStates, currentStationsContent);
    computeActivityStatus(newStates, oldStates);

    console.log("updateStationsStates");
    await updateStationsStates(newStates);

    let stateChanges = getChangedStates(newStates, oldStates);
    try {
        await Promise.all(stateChanges.map(async (change) => {
            await saveStationStateChange(change);
        }));
    } catch (error) {
        console.log(error);
    } 
}

function mergeMedianUsages(medianUsagesForPast30: StationMedianUsage[]) : StationMedianUsage{
    let mergedUsage = new StationMedianUsage();

    medianUsagesForPast30
    .filter(pastMedianUsage => pastMedianUsage?.byStationCode != undefined)
    .forEach(pastMedianUsage => {
        pastMedianUsage.byStationCode.forEach((usage, stationCode)=>{
            if(!mergedUsage.byStationCode.get(stationCode)){
                mergedUsage.byStationCode.set(stationCode, usage);
            }else{
                mergedUsage.byStationCode.get(stationCode).activity +=usage.activity;
            }
        })
    })

    return mergedUsage;
    
}

function mergeUsages(medianUsagesForPast30: StationsUsageStatistics[]) : StationsUsageStatistics{
    let mergedUsage = new StationsUsageStatistics();

    medianUsagesForPast30
    .filter(pastUsage => pastUsage?.byStationCode != undefined)
    .forEach(pastUsage => {
        pastUsage.byStationCode.forEach((usage, stationCode)=>{
            if(!mergedUsage.byStationCode.get(stationCode)){
                mergedUsage.byStationCode.set(stationCode, usage);
            }else{
                mergedUsage.byStationCode.get(stationCode).activity +=usage.activity;
            }
        })
    })

    return mergedUsage;
}


function getMedianUsageForPast30Minutes(datetime: Date) : Promise<StationMedianUsage[]>{
    return Promise.all([
        getMedianUsage(datetime), 
        getMedianUsage(minusMinutes(datetime, 5)), 
        getMedianUsage(minusMinutes(datetime, 10)), 
        getMedianUsage(minusMinutes(datetime, 15)), 
        getMedianUsage(minusMinutes(datetime, 20)),
        getMedianUsage(minusMinutes(datetime, 25))
    ]);
}

function getUsageForPast30Minutes(datetime: Date) : Promise<StationsUsageStatistics[]>{
    return Promise.all([
        getStationUsageStats(datetime), 
        getStationUsageStats(minusMinutes(datetime, 5)), 
        getStationUsageStats(minusMinutes(datetime, 10)), 
        getStationUsageStats(minusMinutes(datetime, 15)), 
        getStationUsageStats(minusMinutes(datetime, 20)),
        getStationUsageStats(minusMinutes(datetime, 25))
    ]);
}

function minusMinutes(date: Date, minutes: number): Date{
    var newDate = new Date();
    newDate.setTime(date.getTime() - (minutes * 60 * 1000));
    return newDate;
}

function computeGlobalUsageRatio(medianUsages: StationMedianUsage, usages: StationsUsageStatistics): number{
    let medianTotal = 0;
    medianUsages.byStationCode.forEach(usage => medianTotal+=usage.activity);

    let usageTotal = 0;
    usages.byStationCode.forEach(usage => usageTotal+=usage.activity);

    return Math.max(globalRatioMin, Math.min(globalRatioMax,usageTotal/medianTotal));
}

function getChangedStates(newStates: StationsStates, oldStates: StationsStates): StationStateChange[]{
    let changes : StationStateChange[] = [];

    let datetime = new Date();
    newStates.byStationCode.forEach((newState, stationCode)=>{
        let oldState = oldStates.byStationCode.get(stationCode);
        if(!oldState || !oldState.activityStatus)
            return;
        
        if(newState.activityStatus != oldState.activityStatus || newState.officialStatus != oldState.officialStatus){
            datetime.setMilliseconds(datetime.getMilliseconds() + 1); //hack to ensure all the pushed changed have a different datetime, as it is part of the key
            changes.push({
                day: toParisDay(datetime),
                datetime: datetime,
                stationCode: stationCode,
                newState: newState,
                oldState: oldState
            });
        }
    })

    return changes;
}

function initStatesFromContent(stationsContent: StationsContent): StationsStates{
    let newStates = new StationsStates();
    newStates.fetchDateTime = stationsContent.fetchDateTime;
    stationsContent.byStationCode.forEach((content, stationCode) => {
        let newState = new StationState();
        newStates.byStationCode.set(stationCode, newState);
        newState.inactiveSince = content.inactiveSince;
        newState.officialStatus = content.officialStatus;
    });
    return newStates;
}

function computeMissingActivities(newStates: StationsStates, oldStates: StationsStates,  medianUsages: StationMedianUsage, globalUsageRatio: number){
    let deltaTimeInSeconds = deltaSeconds(newStates.fetchDateTime, oldStates.fetchDateTime);
    
    newStates.byStationCode.forEach((newState, stationCode) => {
        let oldState = oldStates.byStationCode.get(stationCode);
        if(!oldState){
            oldState = new StationState();
        }
        let medianUsage = medianUsages.byStationCode.get(stationCode);
        let newMissingActivity = getNewMissingActivity(oldState, deltaTimeInSeconds, medianUsage, globalUsageRatio);
        if(isNaN(newMissingActivity)){
            console.error("NaN newMissingActivity");
            console.log(stationCode);
            newMissingActivity = 0;
        }
        newState.missingActivity = newMissingActivity;
        
    });
}

function getNewMissingActivity(state: StationState, deltaTimeInSeconds: number, medianUsage : MedianUsage, globalUsageRatio: number) : number{
    if (!state.inactiveSince) {
        return null;
    }
    let expectedActivityOnDelta = (deltaTimeInSeconds / 1800) * (medianUsage?.activity || 0) * globalUsageRatio;
    return (state.missingActivity??0)+expectedActivityOnDelta;
}

function computeActivityStatus(states: StationsStates, oldStates: StationsStates){
    states.byStationCode.forEach((state, stationCode) => {
        let oldState = oldStates.byStationCode.get(stationCode);

        if(!oldState || oldState.activityStatus != ActivityStatus.Locked){
            if(state.inactiveSince && deltaMinutes(state.inactiveSince, states.fetchDateTime) > coldThresholdMinutesMin && state.missingActivity >= lockedActivityThreshold){
                state.activityStatus = ActivityStatus.Locked;
            }else{
                state.activityStatus = ActivityStatus.Ok;
            }
        }else{
            //previously locked
            if(state.activitySinceLocked > unlockedActivityThreshold){
                state.activityStatus = ActivityStatus.Ok;
            }else{
                //stay locked
                state.activityStatus = ActivityStatus.Locked;
            }
        }
    });

}
function accrueActivitiesSinceLocked(newStates: StationsStates, oldStates: StationsStates, stationsContent : StationsContent) {
    newStates.byStationCode.forEach((newState, stationCode) => {
        let oldState = oldStates.byStationCode.get(stationCode);
       
        if(oldState && oldState.activityStatus == ActivityStatus.Locked){
            newState.activitySinceLocked = oldState.activitySinceLocked + stationsContent.byStationCode.get(stationCode).activity;
        }else{
            newState.activitySinceLocked = 0;
        }
        if(isNaN(newState.activitySinceLocked)){
            console.error("NaN activitySinceLocked");
            console.log(stationCode);
            newState.activitySinceLocked = 0;
        }
    });
}
