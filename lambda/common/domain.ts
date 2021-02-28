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

export class StationsHourlyStatistics {
    constructor() {
        this.byStationCode = new Map();
    }
    @TransformDate()
    statsDateTime: Date;
    hour:number;
    @Type(() => Statistic)
    byStationCode: Map<string, Statistic>;
    @TransformDate()
    lastFetchDateTime: Date;
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

export class StationsExpectedActivities {
    constructor() {
        this.byStationCode = new Map();
    }
    weekday:number;
    hour:number;
    @Type(() => ExpectedActivity)
    byStationCode: Map<string, ExpectedActivity>;
}

export class ExpectedActivity {
    expectedActivity: number;
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
    status: Status;
    officialStatus: OfficialStatus;
    missingActivity: number;
    @TransformDate()
    coldSince?: Date;
}

export enum Status {
    Ok = "Ok",
    Cold = "Cold",
    Locked = "Locked"
}

export enum OfficialStatus {
    Ok = "Ok",
    NotInstalled = "NotInstalled",
    NotRenting = "NotRenting",
    NotReturning = "NotReturning",
    NotRentingNotReturning = "NotRentingNotReturning"
}