import "reflect-metadata";
import { updateStationsCharacteristics } from "../common/repository/stationsCharacteristicsRepository";
import { fetchStationCharacteristics } from "./velibStationsCharacteristicsClient";

export const lambdaHandler = async (event: any) => {
    let stationsCharacteristics = await fetchStationCharacteristics();

    if(stationsCharacteristics.byStationCode.size <= 1){
        throw "No station fetched";
    }

    await updateStationsCharacteristics(stationsCharacteristics);
}