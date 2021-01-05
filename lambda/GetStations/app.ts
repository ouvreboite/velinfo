import "reflect-metadata";
import { Status } from "../../common/domain";
import { getAvailabilities } from "../../common/repository/availabilitiesDynamoRepository";
import { getCharacteristics } from "../../common/repository/characteristicsDynamoRepository";
import { getStationsStates } from "../../common/repository/stationsStatesRepository";

export const lambdaHandler = async () => {
    let [availabilities, stationCharacteristics, stationStates] = await Promise
        .all([getAvailabilities(), getCharacteristics(), getStationsStates()])

    let stations = {};
    for (const [stationCode, characteristics] of stationCharacteristics.byStationCode) {
        let station = new Station();
        station.code = stationCode;
        station.name = characteristics.name;
        station.latitude = characteristics.latitude;
        station.longitude = characteristics.longitude;
        station.capacity = characteristics.capacity;

        if(availabilities.byStationCode.has(stationCode)){
            let availability = availabilities.byStationCode.get(stationCode);
            station.electrical = availability.electrical;
            station.mechanical = availability.mechanical;
            station.empty = availability.empty;
            station.coldSince = availability.coldSince;
            station.officialStatus = availability.officialStatus;
        }

        if(stationStates.byStationCode.has(stationCode)){
            station.expectedActivity = stationStates.byStationCode.get(stationCode).expectedActivity;
            station.state = stationStates.byStationCode.get(stationCode).status;
        }else{
            station.state = Status.Ok;
        }
        
        stations[stationCode] = station;
    }
    
    return {
        fetchDateTime: availabilities.fetchDateTime,
        mostRecentOfficialDueDateTime: availabilities.mostRecentOfficialDueDateTime,
        stations: stations
      }

}

class Station{
    code: string;
    name: string;
    latitude: number;
    longitude: number;
    state: Status;
    capacity: number;
    electrical: number;
    mechanical: number;
    empty: number;
    officialStatus: string;
    coldSince: Date;
    expectedActivity?: number;
}