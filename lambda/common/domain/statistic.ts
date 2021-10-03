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

export class NetworkDailyUsageStatistics {
    constructor() {
        this.byTimeSlot = new Map();
    }
    day: string;
    @Type(() => Statistic)
    byTimeSlot: Map<string, Statistic>;
    totalActivity: number;
}