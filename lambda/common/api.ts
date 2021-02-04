import { Type } from "class-transformer";
import { TransformDate } from "./classTranformerUtil";

export class Station{
    code: string;
    name: string;
    latitude: number;
    longitude: number;
    state: string;
    capacity: number;
    electrical: number;
    mechanical: number;
    empty: number;
    officialStatus: string;
    @TransformDate()
    coldSince: Date;
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

export class ExpectedActivities{
    constructor() {
        this.byStationCode = new Map();
    }
    @Type(() => Array)
    byStationCode: Map<string, number[]>;
}
