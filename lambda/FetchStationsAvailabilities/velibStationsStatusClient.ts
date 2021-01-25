import axios from 'axios';
import { OfficialStatus, StationAvailability, StationCharacteristics, StationsFetchedAvailabilities, StationsFetchedCharacteristics } from "../common/domain";
export { fetchAvailabilities };

const stationsStatusUrl: string = 'https://velib-metropole-opendata.smoove.pro/opendata/Velib_Metropole/station_status.json';

async function fetchAvailabilities(): Promise<StationsFetchedAvailabilities> {
    const response = await axios.get(stationsStatusUrl);
    const fetchedAvailabilities = mapVelibAPI(response.data);
    console.log(fetchedAvailabilities.byStationCode.size + " stations availabilities fetched from Velib API");
    return fetchedAvailabilities;
}

function mapVelibAPI(data: any): StationsFetchedAvailabilities {
    let stationsMap: Map<string, StationAvailability> = data.data.stations
        .map(stationAvailability => {
            var availability = new StationAvailability();
            availability.stationCode = stationAvailability.stationCode;
            availability.empty = stationAvailability.num_docks_available;
            availability.mechanical = stationAvailability.num_bikes_available_types[0].mechanical;
            availability.electrical = stationAvailability.num_bikes_available_types[1].ebike;
            availability.officialStatus = officialStatus(stationAvailability.is_installed == 1,stationAvailability.is_renting == 1,stationAvailability.is_returning == 1);
            return availability;
        })
        .reduce(function (map: Map<string, StationCharacteristics>, characteristics: StationCharacteristics) {
            map.set(characteristics.stationCode, characteristics);
            return map;
        }, new Map<string, StationCharacteristics>());

    let dueDates = data.data.stations.map(stationAvailability => new Date(stationAvailability.last_reported*1000));
    let mostRecentDueDate = new Date(Math.max(...dueDates));
    
    var fetchedAvailabilities = new StationsFetchedAvailabilities();
    fetchedAvailabilities.byStationCode = stationsMap;
    fetchedAvailabilities.fetchDateTime = new Date();
    fetchedAvailabilities.mostRecentOfficialDueDateTime = mostRecentDueDate;
    return fetchedAvailabilities;
}

function officialStatus(installed: boolean, renting: boolean, returning: boolean): OfficialStatus {
    if(installed && returning && renting)
        return OfficialStatus.Ok;
    else if(!installed)
        return OfficialStatus.NotInstalled;     
    else if(!renting && returning)
        return OfficialStatus.NotRenting; 
    else if(!returning && renting)
        return OfficialStatus.NotReturning; 
    else 
        return OfficialStatus.NotRentingNotReturning;
}