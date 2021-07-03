import { Type } from "class-transformer";
import { TransformDate } from "../classTranformerUtil";
import { ContentDelta } from "./content-delta";
import { OfficialStatus } from "./enums";

export class StationContent {
    stationCode: string;
    electrical: number;
    mechanical: number;
    empty: number;
    officialStatus: OfficialStatus;
    @Type(() => ContentDelta)
    delta?: ContentDelta;
}
export class StationsContent {
    constructor() {
        this.byStationCode = new Map();
    }
    @Type(() => StationContent)
    byStationCode: Map<string, StationContent>;
    @TransformDate()
    dateTime: Date;
}