import axios from 'axios';
import https from 'https';
import { StationCharacteristics, StationsFetchedCharacteristics } from "../common/domain";
export { fetchCharacteristics };

const stationsCharacteristicsUrl: string = 'https://velib-metropole-opendata.smoove.pro/opendata/Velib_Metropole/station_information.json';
const agent = new https.Agent({  
    rejectUnauthorized: false
  });

async function fetchCharacteristics(): Promise<StationsFetchedCharacteristics> {
    const response = await axios.get(stationsCharacteristicsUrl, { httpsAgent: agent });
    if(response.status != 200){
        console.error("Reponse status "+response.status);
        console.error(response.data);
        throw "Incorrect response status "+response.status;
    }
    const fetchedStationCharacteristics = mapVelibAPI(response.data);
    console.log(fetchedStationCharacteristics.byStationCode.size + " stations characteristics fetched from Velib API");
    return fetchedStationCharacteristics;
}

function mapVelibAPI(data: any): StationsFetchedCharacteristics {
    let stationsMap: Map<string, StationCharacteristics> = data.data.stations
        .map(stationCharacteristic => {
            var characteristics = new StationCharacteristics();
            characteristics.stationCode = stationCharacteristic.stationCode;
            characteristics.name = stationCharacteristic.name.trim();
            characteristics.longitude = stationCharacteristic.lon;
            characteristics.latitude = stationCharacteristic.lat;
            characteristics.capacity = stationCharacteristic.capacity;
            return characteristics;
        })
        .reduce(function (map: Map<string, StationCharacteristics>, characteristics: StationCharacteristics) {
            map.set(characteristics.stationCode, characteristics);
            return map;
        }, new Map<string, StationCharacteristics>());

    var fetchedCharacteristics = new StationsFetchedCharacteristics();
    fetchedCharacteristics.byStationCode = stationsMap;
    fetchedCharacteristics.fetchDateTime = new Date();
    fetchedCharacteristics.officialDateTime = new Date(data.lastUpdatedOther*1000);
    return fetchedCharacteristics;
}