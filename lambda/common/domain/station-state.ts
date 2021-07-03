import { Type } from "class-transformer";
import { TransformDate } from "../classTranformerUtil";
import { ActivityStatus, OfficialStatus } from "./enums";

export class StationState {
    activityStatus: ActivityStatus;
    officialStatus: OfficialStatus;
    missingActivity: number;
    activitySinceLocked: number;
    @TransformDate()
    inactiveSince?: Date;
}

export class StationStateChange {
    day: string;
    @TransformDate()
    datetime: Date;
    stationCode: string;
    @Type(() => StationState)
    oldState: StationState;
    @Type(() => StationState)
    newState: StationState;
}

export class StationsStates {
    constructor() {
        this.byStationCode = new Map();
    }
    @Type(() => StationState)
    byStationCode: Map<string, StationState>;
    @TransformDate()
    fetchDateTime: Date;
}