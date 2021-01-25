import "reflect-metadata";
import {fetchCharacteristics} from "./velibStationsCharacteristicsClient";
import {updateCharacteristics} from "../common/repository/characteristicsDynamoRepository";

export const lambdaHandler = async (event: any) => {
    let stationsCharacteristics = await fetchCharacteristics()
    await updateCharacteristics(stationsCharacteristics);
}