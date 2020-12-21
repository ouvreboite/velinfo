import "reflect-metadata";
import { DynamoDBStreamEvent } from "aws-lambda";
import { Status, StationsStates, StationState, ExpectedActivity } from "../../common/domain";
import { extractStationsExpectedActivities } from "../../common/dynamoEventExtractor";
import { updateStationsStates } from "../../common/repository/stationsStatesRepository";
import { deltaMinutes } from "../../common/dateUtil";

const coldThresholdMinutesMin: number = +process.env.COLD_THRESHOLD_MINUTES_MIN;
const coldThresholdMinutesMax: number = +process.env.COLD_THRESHOLD_MINUTES_MAX;
const lockedActivityThreshold: number = +process.env.LOCKED_ACTIVITY_THRESHOLD;

export const lambdaHandler = async (event: DynamoDBStreamEvent) => {
    let expectedActivities = extractStationsExpectedActivities(event);
    if(!expectedActivities.fetchDateTime){
        console.error("No fetchDateTime in event, pass");
        return;
    }

    let states = new StationsStates();
    states.fetchDateTime = expectedActivities.fetchDateTime;

    expectedActivities.byStationCode.forEach((expectedActivity, stationCode) => {
        let state = computeState(expectedActivity, states.fetchDateTime);
        states.byStationCode.set(stationCode, state);
    });

    await updateStationsStates(states);
}

function computeState(expectedActivity: ExpectedActivity, fetchDateTime: Date) {
    let state = new StationState();
    state.coldSince = expectedActivity.coldSince;
    state.expectedActivity = expectedActivity.value;
    
    if (!state.coldSince) {
        state.status = Status.Ok;
    } else if (deltaMinutes(state.coldSince, fetchDateTime) <= coldThresholdMinutesMin) {
        state.status = Status.Ok;
    } else if (deltaMinutes(state.coldSince, fetchDateTime) >= coldThresholdMinutesMax) {
        state.status = Status.Locked;
    } else if (expectedActivity.value >= lockedActivityThreshold) {
        state.status = Status.Locked;
    } else {
        state.status = Status.Cold;
    }
    return state;
}
