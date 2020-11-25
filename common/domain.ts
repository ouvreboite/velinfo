import { Type, Transform } from 'class-transformer';

export class StationAvailability {
    stationCode: string;
    name: string;
    longitude: number;
    latitude: number;
    electrical: number;
    mechanical: number;
    capacity: number;
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

export function TransformDate() {
    const toPlain = Transform(value => (value as Date).toISOString(), {
        toPlainOnly: true
    });

    const toClass = Transform(value => new Date(value), {
        toClassOnly: true
    });

    return function (target: any, key: string) {
        toPlain(target, key);
        toClass(target, key);
    };
}
