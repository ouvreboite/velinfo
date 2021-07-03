import "reflect-metadata";
import { updateStationsCharacteristics } from "../common/repository/stationsCharacteristicsDynamoRepository";
import { fetchStationCharacteristics } from "./velibStationsCharacteristicsClient";

export const lambdaHandler = async (event: any) => {
    let stationsCharacteristics = await fetchStationCharacteristics();

    if(stationsCharacteristics.byStationCode.size == 1){
        throw "Only one station fetched, retrying";
    }

    await updateStationsCharacteristics(stationsCharacteristics);
}