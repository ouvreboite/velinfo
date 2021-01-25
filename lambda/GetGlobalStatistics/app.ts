import "reflect-metadata";
import { GlobalStatistics } from "../common/api";
import { getGlobalStatistics } from "../common/repository/prefilledApiRepository";

const cacheTTLseconds = 30;
var cachedTimestamp : Date;
var cachedGlobalStatistics : GlobalStatistics;

export const lambdaHandler = async () => {
    if(cacheHot()){
        return cachedGlobalStatistics;
    }

    let globalStatistics = await getGlobalStatistics();

    updateCache(globalStatistics)
    
    return globalStatistics;
}
function cacheHot(){
    if(!cachedTimestamp)
        return false;
    
    var difSeconds = (new Date().getTime() - cachedTimestamp.getTime())/ 1000;
    return difSeconds < cacheTTLseconds;
}

function updateCache(globalStatistics : GlobalStatistics){
    cachedTimestamp = new Date();

    cachedGlobalStatistics = globalStatistics;
    globalStatistics["cachedTimestamp"] = cachedTimestamp;
}