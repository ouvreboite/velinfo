import axios from 'axios';
import { StationCharacteristics, StationsFetchedCharacteristics } from "../../common/domain";
export { fetchCharacteristics };

const stationsCharacteristicsUrl: string = 'https://velib-metropole-opendata.smoove.pro/opendata/Velib_Metropole/station_information.json';

async function fetchCharacteristics(): Promise<StationsFetchedCharacteristics> {
    const response = await axios.get(stationsCharacteristicsUrl);
    const fetchedStationCharacteristics = mapVelibAPI(response.data);
    console.log(fetchedStationCharacteristics.byStationCode.size + " stations characteristics fetched from Velib API");
    return fetchedStationCharacteristics;
}

function mapVelibAPI(data: any): StationsFetchedCharacteristics {
    let stationsMap: Map<string, StationCharacteristics> = data.data.stations
        .map(stationCharacteristic => {
            var characteristics = new StationCharacteristics();
            characteristics.stationCode = stationCharacteristic.stationCode;
            characteristics.name = stationCharacteristic.name;
            characteristics.longitude = stationCharacteristic.lon;
            characteristics.latitude = stationCharacteristic.lat;
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