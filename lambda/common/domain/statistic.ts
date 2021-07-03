import { Type } from "class-transformer";
import { TransformDate } from "../classTranformerUtil";

export class Statistic {
    activity: number = 0;
}

export class StationsUsageStatistics {
    constructor() {
        this.byStationCode = new Map();
    }
    day: string;
    timeslot: string;
    @Type(() => Statistic)
    byStationCode: Map<string, Statistic>;
    totalActivity: number;
}

export class GlobalDailyStatistics {
    constructor() {
        this.byHour = new Map();
    }
    stats_day: string;
    @TransformDate()
    firstFetchDateTime: Date;
    @Type(() => Statistic)
    byHour: Map<string, Statistic>;
    totalActivity: number;
}