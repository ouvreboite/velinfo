import { Type } from "class-transformer";

export class StationMedianUsage {
    constructor() {
        this.byStationCode = new Map();
    }
    weekday:number;
    timeslot:string;
    @Type(() => MedianUsage)
    byStationCode: Map<string, MedianUsage>;
}

export class MedianUsage {
    activity: number;
}

export class NetworkDailyUsagePredictions {
    constructor() {
        this.byTimeSlot = new Map();
    }
    weekday: number;
    @Type(() => MedianUsage)
    byTimeSlot: Map<string, MedianUsage>;
    totalActivity: number;
}