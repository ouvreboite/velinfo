export class Station{
    code: string;
    name: string;
    latitude: number;
    longitude: number;
    state: string;
    capacity: number;
    electrical: number;
    mechanical: number;
    empty: number;
    officialStatus: string;
    coldSince: Date;
    expectedActivity?: number;
}

export class CurrentStations{
    fetchDateTime: Date;
    mostRecentOfficialDueDateTime: Date;
    stations: Station[];
}

export class GlobalStatistic{
    day: string;
    hour: number;
    activity: number;
}

export class GlobalStatistics{
    statistics: GlobalStatistic[] = [];
    todaysActivity: number;
}