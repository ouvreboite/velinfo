import "reflect-metadata";
import { CurrentStations } from "../common/api";
import { getCurrentStations } from "../common/repository/prefilledApiRepository";

const cacheTTLseconds = 30;
var cachedTimestamp : Date;
var cachedCurrentStations : CurrentStations;

export const lambdaHandler = async () => {
    if(cacheHot()){
        return cachedCurrentStations;
    }

    let currentStations = await getCurrentStations();
    updateCache(currentStations);
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