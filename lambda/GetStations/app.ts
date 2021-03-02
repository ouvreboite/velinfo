import "reflect-metadata";
import { CurrentStations, Station } from "../common/api";
import { ActivityStatus, StationsFetchedAvailabilities, StationsFetchedCharacteristics, StationsStates } from "../common/domain";
import { getAvailabilities } from "../common/repository/availabilitiesDynamoRepository";
import { getCharacteristics } from "../common/repository/characteristicsDynamoRepository";
import { getStationsStates } from "../common/repository/stationsStatesRepository";

export const lambdaHandler = async () => {
    let [availabilities, stationCharacteristics, stationStates] = await Promise
        .all([getAvailabilities(), getCharacteristics(), getStationsStates()])

    let stations: Station[] = buildStations(stationCharacteristics, availabilities, stationStates);
    
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

function buildStations(stationCharacteristics: StationsFetchedCharacteristics, availabilities: StationsFetchedAvailabilities, stationStates: StationsStates): Station[] {
    let stations: Station[] = [];
    for (const [stationCode, characteristics] of stationCharacteristics.byStationCode) {
        let station = new Station();
        station.code = stationCode;
        station.name = characteristics.name;
        station.latitude = characteristics.latitude;
        station.longitude = characteristics.longitude;
        station.capacity = characteristics.capacity;

        if (availabilities.byStationCode.has(stationCode)) {
            let availability = availabilities.byStationCode.get(stationCode);
            station.electrical = availability.electrical;
            station.mechanical = availability.mechanical;
            station.empty = availability.empty;
            station.coldSince = availability.coldSince;
            station.officialStatus = availability.officialStatus;
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
