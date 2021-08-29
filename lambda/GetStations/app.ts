import "reflect-metadata";
import { CurrentStations, Station } from "../common/api";
import { getLastStationsContent } from "../common/repository/stationsContentRepository";
import { getStationsStates } from "../common/repository/stationsStatesRepository";
import { StationsContent } from "../common/domain/station-content";
import { ActivityStatus } from "../common/domain/enums";
import { StationsCharacteristics } from "../common/domain/station-characteristics";
import { StationsStates } from "../common/domain/station-state";
import { getLastStationsCharacteristics } from "../common/repository/stationsCharacteristicsRepository";

export const lambdaHandler = async () => {
    let [contents, stationCharacteristics, stationStates] = await Promise
        .all([getLastStationsContent(), getLastStationsCharacteristics(), getStationsStates()])

    let stations: Station[] = buildStations(stationCharacteristics, contents, stationStates);
    
    let currentStations = {
        stations: stations
    } as CurrentStations;

    return {
        statusCode: 200,
        headers:{
            "Access-Control-Allow-Origin": 'https://www.velinfo.fr',
        },
        body: JSON.stringify(currentStations),
        isBase64Encoded: false
    };
}

function buildStations(stationCharacteristics: StationsCharacteristics, contents: StationsContent, stationStates: StationsStates): Station[] {
    let stations: Station[] = [];
    for (const [stationCode, characteristics] of stationCharacteristics.byStationCode) {
        let station = new Station();
        station.code = stationCode;
        station.name = characteristics.name;
        station.latitude = characteristics.latitude;
        station.longitude = characteristics.longitude;
        station.capacity = characteristics.capacity;

        if (contents.byStationCode.has(stationCode)) {
            let content = contents.byStationCode.get(stationCode);
            station.electrical = content.electrical;
            station.mechanical = content.mechanical;
            station.empty = content.empty;
            station.officialStatus = content.officialStatus;
            station.inactiveSince = content.delta?.inactiveSince;
        }

        if (stationStates.byStationCode.has(stationCode)) {
            station.missingActivity = stationStates.byStationCode.get(stationCode).missingActivity;
            station.activityStatus = stationStates.byStationCode.get(stationCode).activityStatus;
        } else {
            station.activityStatus = ActivityStatus.Ok;
        }

        stations.push(station);
    }
    return stations;
}
