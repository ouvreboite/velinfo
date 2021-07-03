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