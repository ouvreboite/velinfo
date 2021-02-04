import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import "reflect-metadata";
import { ExpectedActivities } from "../common/api";
import { toParisDay } from "../common/dateUtil";
import { getExpectedActivities } from "../common/repository/prefilledApiRepository";

const cacheTTLseconds = 300;
var cachedTimestamp : Date;
var cachedExpectedActivities : ExpectedActivities;

export const lambdaHandler = async (event: APIGatewayProxyEventV2) => {
    let stationCode = event.pathParameters["stationCode"];

    if(!cacheHot()){
        let expectedActivities = await getExpectedActivities();
        updateCache(expectedActivities);
    }

    if(!cachedExpectedActivities.byStationCode.get(stationCode)){
        return notFound(stationCode);
    }
    return cachedExpectedActivities.byStationCode.get(stationCode);
}

function cacheHot(){
    if(!cachedTimestamp)
        return false;

    if(toParisDay(cachedTimestamp) != toParisDay(new Date()))
        return false;
    
    var diffSeconds = (new Date().getTime() - cachedTimestamp.getTime())/ 1000;
    return diffSeconds < cacheTTLseconds;
}

function updateCache(expectedActivities : ExpectedActivities){
    cachedTimestamp = new Date();

    cachedExpectedActivities = expectedActivities;
    expectedActivities["cachedTimestamp"] = cachedTimestamp;
}

function notFound(stationCode: string): APIGatewayProxyResultV2{
    return {
        statusCode: 404,
        body: "Unknown station code: "+stationCode
    }  
}