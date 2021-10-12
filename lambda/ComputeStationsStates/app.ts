import "reflect-metadata";
import { DynamoDBStreamEvent } from "aws-lambda";
import { StationsFetchedAvailabilities, StationsStates, StationsExpectedActivities, StationState, ExpectedActivity, StationStateChange, ActivityStatus } from "../common/domain";
import { extractDynamoEvent } from "../common/dynamoEventExtractor";
import { deltaMinutes, deltaSeconds, toParisDay, toParisTZ } from "../common/dateUtil";
import { getExpectedHourlyActivities } from "../common/repository/expectedActivitiesRepository";
import { getStationsStates, updateStationsStates } from "../common/repository/stationsStatesRepository";
import { saveStationStateChange } from "../common/repository/stationsStatesChangesRepository";

const coldThresholdMinutesMin: number = +process.env.COLD_THRESHOLD_MINUTES_MIN;
const lockedActivityThreshold: number = +process.env.LOCKED_ACTIVITY_THRESHOLD;
const unlockedActivityThreshold: number = +process.env.UNLOCKED_ACTIVITY_THRESHOLD;

export const lambdaHandler = async (event: DynamoDBStreamEvent) => {
    let availabilities = extractDynamoEvent(StationsFetchedAvailabilities, event);
    if(!availabilities.fetchDateTime){
        console.error("No fetchDateTime in event, pass");
        return;
    }
    let [expectedHourlyActivities, oldStates] = await Promise
        .all([getExpectedHourlyActivities(availabilities.fetchDateTime), getStationsStates()])

    if (oldStates === undefined) { //special case for first run
        oldStates = new StationsStates();
        oldStates.fetchDateTime = availabilities.fetchDateTime;
    }

    if(expectedHourlyActivities === undefined){
        console.log("No expected hourly activities");
        expectedHourlyActivities = new StationsExpectedActivities();
    }

    let newStates = initStatesFromAvailabilities(availabilities);
    computeMissingActivities(newStates, oldStates, expectedHourlyActivities);
    accrueActivitiesSinceLocked(newStates, oldStates, availabilities);
    computeActivityStatus(newStates, oldStates);

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

function initStatesFromAvailabilities(availabilities: StationsFetchedAvailabilities): StationsStates{
    let newStates = new StationsStates();
    newStates.fetchDateTime = availabilities.fetchDateTime;
    availabilities.byStationCode.forEach((availability, stationCode) => {
        let newState = new StationState();
        newStates.byStationCode.set(stationCode, newState);
        newState.coldSince = availability.coldSince;
        newState.officialStatus = availability.officialStatus;
    });
    return newStates;
}

function computeMissingActivities(newStates: StationsStates, oldStates: StationsStates, expectedHourlyActivities: StationsExpectedActivities){
    let deltaTimeInSeconds = deltaSeconds(newStates.fetchDateTime, oldStates.fetchDateTime);
    
    newStates.byStationCode.forEach((newState, stationCode) => {
        let oldState = oldStates.byStationCode.get(stationCode);
        if(!oldState){
            oldState = new StationState();
        }
        let expectedHourlyActivity = expectedHourlyActivities.byStationCode.get(stationCode);
        let newMissingActivity = getNewMissingActivity(oldState, deltaTimeInSeconds, expectedHourlyActivity);
        newState.missingActivity = newMissingActivity;
    });
}

function getNewMissingActivity(state: StationState, deltaTimeInSeconds: number, expectedHourlyActivity : ExpectedActivity) : number{
    if (!state.coldSince) {
        return null;
    }
    let expectedActivityOnDelta = (expectedHourlyActivity?.expectedActivity || 0) * deltaTimeInSeconds / 3600;
    return (state.missingActivity??0)+expectedActivityOnDelta;
}

function computeActivityStatus(states: StationsStates, oldStates: StationsStates){
    states.byStationCode.forEach((state, stationCode) => {
        let oldState = oldStates.byStationCode.get(stationCode);

        if(!oldState || oldState.activityStatus != ActivityStatus.Locked){
            if(state.coldSince && deltaMinutes(state.coldSince, states.fetchDateTime) > coldThresholdMinutesMin && state.missingActivity >= lockedActivityThreshold){
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
function accrueActivitiesSinceLocked(newStates: StationsStates, oldStates: StationsStates, availabilities : StationsFetchedAvailabilities) {
    newStates.byStationCode.forEach((newState, stationCode) => {
        let oldState = oldStates.byStationCode.get(stationCode);
       
        if(oldState && oldState.activityStatus == ActivityStatus.Locked){
            newState.activitySinceLocked = oldState.activitySinceLocked + availabilities.byStationCode.get(stationCode).activity;
        }else{
            newState.activitySinceLocked = 0;
        }
    });
}

