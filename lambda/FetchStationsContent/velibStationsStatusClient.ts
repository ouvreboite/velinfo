import axios from 'axios';
import https from 'https';
import { OfficialStatus, StationContent, StationCharacteristics, StationsContent, StationsFetchedCharacteristics } from "../common/domain";
export { fetchStationsContent };

const stationsStatusUrl: string = 'https://velib-metropole-opendata.smoove.pro/opendata/Velib_Metropole/station_status.json';
const agent = new https.Agent({  
    rejectUnauthorized: false
  });

async function fetchStationsContent(): Promise<StationsContent> { 
    const response = await axios.get(stationsStatusUrl, { httpsAgent: agent });
    const fetchedContent = mapVelibAPI(response.data);
    console.log(fetchedContent.byStationCode.size + " stations content fetched from Velib API");
    return fetchedContent;
}

function mapVelibAPI(data: any): StationsContent {
    let stationsMap: Map<string, StationContent> = data.data.stations
        .map(stationStatus => {
            var content = new StationContent();
            content.stationCode = stationStatus.stationCode;
            content.empty = stationStatus.num_docks_available;
            content.mechanical = stationStatus.num_bikes_available_types[0].mechanical;
            content.electrical = stationStatus.num_bikes_available_types[1].ebike;
            content.officialStatus = officialStatus(stationStatus.is_installed == 1,stationStatus.is_renting == 1,stationStatus.is_returning == 1);
            return content;
        })
        .reduce(function (map: Map<string, StationContent>, content: StationContent) {
            map.set(content.stationCode, content);
            return map;
        }, new Map<string, StationContent>());

    var fetchedContent = new StationsContent();
    fetchedContent.byStationCode = stationsMap;
    fetchedContent.fetchDateTime = new Date();
    return fetchedContent;
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