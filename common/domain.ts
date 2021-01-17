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

export class StationStatistic extends Statistic {
    minElectrical: number;
    minMechanical: number;
    minEmpty: number;
}

export class StationsHourlyStatistics {
    constructor() {
        this.byStationCode = new Map();
    }
    @TransformDate()
    statsDateTime: Date;
    @Type(() => StationStatistic)
    byStationCode: Map<string, StationStatistic>;
    @TransformDate()
    lastUpdateDateTime?: Date;
    @TransformDate()
    lastFetchDateTime: Date;
    totalActivity: number;
}

export class GlobalDailyStatistics {
    constructor() {
        this.byHour = new Map();
    }
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
    @Type(() => ExpectedActivity)
    byStationCode: Map<string, ExpectedActivity>;
    @TransformDate()
    fetchDateTime: Date;
}

export class ExpectedActivity {
    value: number;
    @TransformDate()
    coldSince?: Date;
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
    expectedActivity: number;
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