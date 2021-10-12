import { Type } from 'class-transformer';
import { TransformDate } from './classTranformerUtil';

export class StationAvailability {
    stationCode: string;
    electrical: number;
    mechanical: number;
    empty: number;
    officialStatus: OfficialStatus;
    deltaElectrical?: number;
    deltaMechanical?: number;
    activity?: number;
    @TransformDate()
    coldSince?: Date;
}

export class StationsFetchedAvailabilities {
    constructor() {
        this.byStationCode = new Map();
    }
    @Type(() => StationAvailability)
    byStationCode: Map<string, StationAvailability>;
    @TransformDate()
    fetchDateTime: Date;
    @TransformDate()
    mostRecentOfficialDueDateTime: Date;
}

export class StationCharacteristics {
    stationCode: string;
    name: string;
    longitude: number;
    latitude: number;
    capacity: number;
}

export class StationsFetchedCharacteristics {
    constructor() {
        this.byStationCode = new Map();
    }
    @Type(() => StationCharacteristics)
    byStationCode: Map<string, StationCharacteristics>;
    @TransformDate()
    fetchDateTime: Date;
    @TransformDate()
    officialDateTime: Date;
}

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

export class StationsStates {
    constructor() {
        this.byStationCode = new Map();
    }
    @Type(() => StationState)
    byStationCode: Map<string, StationState>;
    @TransformDate()
    fetchDateTime: Date;
}

export class StationState {
    activityStatus: ActivityStatus;
    officialStatus: OfficialStatus;
    missingActivity: number;
    activitySinceLocked: number;
    @TransformDate()
    coldSince?: Date;
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

export enum ActivityStatus {
    Ok = "Ok",
    Locked = "Locked"
}

export enum OfficialStatus {
    Ok = "Ok",
    NotInstalled = "NotInstalled",
    NotRenting = "NotRenting",
    NotReturning = "NotReturning",
    NotRentingNotReturning = "NotRentingNotReturning"
}