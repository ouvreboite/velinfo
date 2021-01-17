import "reflect-metadata";
import { CurrentStations, Station } from "../../common/api";
import { Status } from "../../common/domain";
import { getAvailabilities } from "../../common/repository/availabilitiesDynamoRepository";
import { getCharacteristics } from "../../common/repository/characteristicsDynamoRepository";
import { getStationsStates } from "../../common/repository/stationsStatesRepository";

const cacheTTLseconds = 30;
var cachedTimestamp : Date;
var cachedCurrentStations : CurrentStations;

export const lambdaHandler = async () => {
    if(cacheHot()){
        return cachedCurrentStations;
    }

    let [availabilities, stationCharacteristics, stationStates] = await Promise
        .all([getAvailabilities(), getCharacteristics(), getStationsStates()])

    let stations: Station[] = [];
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
        
        stations.push(station);
    }


    var currentStations = {
        fetchDateTime: availabilities.fetchDateTime,
        mostRecentOfficialDueDateTime: availabilities.mostRecentOfficialDueDateTime,
        stations: stations
    } as CurrentStations;

    updateCache(currentStations)
    
    return cachedCurrentStations;
}

function cacheHot(){
    if(!cachedTimestamp)
        return false;
    
    var difSeconds = (new Date().getTime() - cachedTimestamp.getTime())/ 1000;
    return difSeconds < cacheTTLseconds;
}

function updateCache(currentStations : CurrentStations){
    cachedTimestamp = new Date();

    cachedCurrentStations = currentStations;
    cachedCurrentStations["cachedTimestamp"] = cachedTimestamp;
}