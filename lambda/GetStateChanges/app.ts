import { differenceInDays } from "date-fns";
import "reflect-metadata";
import { StateChanges } from "../common/api";
import { StationStateChange } from "../common/domain";
import { getStationStateChangesForDay } from "../common/repository/stationsStatesChangesRepository";

export const lambdaHandler = async () => {
    let changes = await getLastNthStationStateChangesOnPastWeek(10);
    
    let stationChanges = {
        stationStateChanges: changes
    } as StateChanges;

    return {
        statusCode: 200,
        headers:{
            "Access-Control-Allow-Origin": 'https://www.velinfo.fr',
        },
        body: JSON.stringify(stationChanges),
        isBase64Encoded: false
    };
}

async function getLastNthStationStateChangesOnPastWeek(nth: number): Promise<StationStateChange[]> {
    let date = new Date();
    let allChanges : StationStateChange[] = [];
    do{
        let changes = await getStationStateChangesForDay(date);
        allChanges.push(... changes);
        date.setDate(date.getDate()-1);
    }while(allChanges.length < nth && differenceInDays(new Date(), date) < 7)
    
    return allChanges.slice(0, nth);
}
