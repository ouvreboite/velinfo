import { differenceInDays } from "date-fns";
import "reflect-metadata";
import { StateChanges, StationStateChange } from "../common/api";
import { getStationStateChangesForDay } from "../common/repository/stationsStatesChangesRepository";

export const lambdaHandler = async () => {
    let changes = await getLastNthStationStateChangesOnPastDays(14,10);
    
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

async function getLastNthStationStateChangesOnPastDays(days: number, maxNumberOfEvents: number): Promise<StationStateChange[]> {
    let date = new Date();
    let allChanges : StationStateChange[] = [];
    do{
        let changes = await getStationStateChangesForDay(date);
        allChanges.push(... changes);
        date.setDate(date.getDate()-1);
    } while(allChanges.length < maxNumberOfEvents && differenceInDays(new Date(), date) < days)
    
    return allChanges.slice(0, maxNumberOfEvents);
}
