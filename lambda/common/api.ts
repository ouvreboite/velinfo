import { TransformDate } from "./classTranformerUtil";

export class Station{
    code: string;
    name: string;
    latitude: number;
    longitude: number;
    activityStatus: string;
    capacity: number;
    electrical: number;
    mechanical: number;
    empty: number;
    officialStatus: string;
    @TransformDate()
    inactiveSince?: Date;
    missingActivity?: number;
}

export class CurrentStations{
    stations: Station[];
}

export class GlobalStatistic{
    day: string;
    hour: number;
    activity: number;
}

export class GlobalStatistics{
    statistics: GlobalStatistic[] = [];
    todaysActivity: number;
}

export class Activities{
    accurateActivities: Activity[] = [];
}

export class Activity{
    stationCode: string;
    activity: number[];
}

export class StateChanges{
    stationStateChanges: StationStateChange[];
}

export class StationStateChange {
    datetime: Date;
    stationCode: string;
    oldState: StationState;
    newState: StationState;
}

export class StationState {
    activityStatus: string;
    officialStatus: string;
    missingActivity: number;
    inactiveSince?: Date;
}

