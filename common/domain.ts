import { Type } from 'class-transformer';
import { TransformDate } from './classTranformerUtil';

export class StationAvailability {
    stationCode: string;
    electrical: number;
    mechanical: number;
    empty: number;
    installed: boolean;
    renting: boolean;
    returning: boolean;
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
    activity: number;
    minElectrical: number;
    minMechanical: number;
    minEmpty: number;
}

export class StationsHourlyStatistics {
    constructor() {
        this.byStationCode = new Map();
    }
    statsDay: string;
    @TransformDate()
    statsDateTime: Date;
    @Type(() => Statistic)
    byStationCode: Map<string, Statistic>;
    @TransformDate()
    lastUpdateDateTime?: Date;
    @TransformDate()
    lastFetchDateTime: Date;
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