import "reflect-metadata";
import { DynamoDBStreamEvent } from "aws-lambda";
import { StationsFetchedAvailabilities, StationsStates, StationsExpectedActivities, StationState, ExpectedActivity, Status } from "../common/domain";
import { extractStationsFetchedAvailabilities } from "../common/dynamoEventExtractor";
import { deltaMinutes, deltaSeconds } from "../common/dateUtil";
import { getExpectedHourlyActivities } from "../common/repository/expectedActivitiesRepository";
import { getStationsStates, updateStationsStates } from "../common/repository/stationsStatesRepository";

const coldThresholdMinutesMin: number = +process.env.COLD_THRESHOLD_MINUTES_MIN;
const coldThresholdMinutesMax: number = +process.env.COLD_THRESHOLD_MINUTES_MAX;
const lockedActivityThreshold: number = +process.env.LOCKED_ACTIVITY_THRESHOLD;

export const lambdaHandler = async (event: DynamoDBStreamEvent) => {
    let availabilities = extractStationsFetchedAvailabilities(event);
    if(!availabilities.fetchDateTime){
        console.error("No fetchDateTime in event, pass");
        return;
    }
    let [expectedHourlyActivities, states] = await Promise
        .all([getExpectedHourlyActivities(availabilities.fetchDateTime), getStationsStates()])

    if (states === undefined) { //special case for first run
        states = new StationsStates();
        states.fetchDateTime = availabilities.fetchDateTime;
    }

    if(expectedHourlyActivities === undefined){
        console.log("No expected hourly activities");
        expectedHourlyActivities = new StationsExpectedActivities();
    }
    updateMissingActivities(availabilities, states, expectedHourlyActivities);
    states.fetchDateTime = availabilities.fetchDateTime;
    computeStatus(states);

    await updateStationsStates(states);
}

function updateMissingActivities(availabilities: StationsFetchedAvailabilities, states: StationsStates, expectedHourlyActivities: StationsExpectedActivities){
    let deltaTimeInSeconds = deltaSeconds(availabilities.fetchDateTime, states.fetchDateTime);
    
    availabilities.byStationCode.forEach((availability, stationCode) => {
        let state = states.byStationCode.get(stationCode);
        if(!state){
            state = new StationState();
            states.byStationCode.set(stationCode, state);
        }
            
        state.coldSince = availability.coldSince;
        let expectedHourlyActivity = expectedHourlyActivities.byStationCode.get(stationCode);
        updateMissingActivity(state, deltaTimeInSeconds, expectedHourlyActivity);
    });
}

function updateMissingActivity(state: StationState, deltaTimeInSeconds: number, expectedHourlyActivity : ExpectedActivity){
    if (!state.coldSince) {
        state.missingActivity = null;
    }
    let expectedActivityOnDelta = (expectedHourlyActivity?.expectedActivity || 0) * deltaTimeInSeconds / 3600;
    state.missingActivity = (state.missingActivity??0)+expectedActivityOnDelta;
}

function computeStatus(states: StationsStates){
    states.byStationCode.forEach((state, stationCode) => {
        if (!state.coldSince) {
            state.status = Status.Ok;
        } else if (deltaMinutes(state.coldSince, states.fetchDateTime) <= coldThresholdMinutesMin) {
            state.status = Status.Ok;
        } else if (deltaMinutes(state.coldSince, states.fetchDateTime) >= coldThresholdMinutesMax) {
            state.status = Status.Locked;
        } else if (state.missingActivity >= lockedActivityThreshold) {
            state.status = Status.Locked;
        } else {
            state.status = Status.Cold;
        }
    });

}
