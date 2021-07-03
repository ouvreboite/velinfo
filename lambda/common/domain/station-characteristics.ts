import { Type } from "class-transformer";
import { TransformDate } from "../classTranformerUtil";

export class StationCharacteristics {
    stationCode: string;
    name: string;
    longitude: number;
    latitude: number;
    capacity: number;
}

export class StationsCharacteristics {
    constructor() {
        this.byStationCode = new Map();
    }
    @Type(() => StationCharacteristics)
    byStationCode: Map<string, StationCharacteristics>;
    @TransformDate()
    dateTime: Date;
}