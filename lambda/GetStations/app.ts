import "reflect-metadata";
import { Status } from "../../common/domain";
import { getAvailabilities } from "../../common/repository/availabilitiesDynamoRepository";
import { getStationsStates } from "../../common/repository/stationsStatesRepository";

export const lambdaHandler = async () => {
    let [availabilities, stationStates] = await Promise
        .all([getAvailabilities(), getStationsStates()])


    let stations = {};
    for (const [stationCode, availability] of availabilities.byStationCode) {
        let station = new Station();
        station.code = stationCode;
        station.electrical = availability.electrical;
        station.mechanical = availability.mechanical;
        station.empty = availability.empty;
        station.coldSince = availability.coldSince;
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
    state: Status;
    capacity: number;
    electrical: number;
    mechanical: number;
    empty: number;
    coldSince: Date;
    expectedActivity?: number;
}