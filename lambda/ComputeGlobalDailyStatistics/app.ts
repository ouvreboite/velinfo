import "reflect-metadata";
import {DynamoDBStreamEvent} from "aws-lambda";
import {GlobalDailyStatistics, StationsContent, Statistic} from "../common/domain";
import {extractDynamoEvent} from "../common/dynamoEventExtractor";
import { getGlobalDailyStats, updateGlobalDailyStats } from "../common/repository/globalDailyStatsDynamoRepository";
import { toParisTZ } from "../common/dateUtil";

export const lambdaHandler = async (event: DynamoDBStreamEvent) => {
    var currentStationsContent = extractDynamoEvent(StationsContent, event);
    if(!currentStationsContent.fetchDateTime){
        console.error("No fetchDateTime in event, pass");
        return;
    }

    var prevStats = await getGlobalDailyStats(currentStationsContent.fetchDateTime);
    console.log("prevStats loaded");
    var stats = buildStatistics(currentStationsContent, prevStats);
    console.log("updating stats");
    console.log(stats);
    await updateGlobalDailyStats(stats);
}

function buildStatistics(stationsContent: StationsContent, prevStats: GlobalDailyStatistics): GlobalDailyStatistics {
    if(!prevStats){
        prevStats = new GlobalDailyStatistics();
        prevStats.totalActivity = 0;
        prevStats.firstFetchDateTime = stationsContent.fetchDateTime;
    }

    var newActivityForHour = 0;
    for (const content of stationsContent.byStationCode.values()) {   
        if(isNaN(content.deltaElectrical) || isNaN(content.deltaMechanical)){
            console.error("NaN");
            console.log(content);
        }else{
            newActivityForHour += Math.abs(content.deltaElectrical);
            newActivityForHour += Math.abs(content.deltaMechanical);
        }
    }

    prevStats.totalActivity+=newActivityForHour;

    var statsHour = toParisTZ(stationsContent.fetchDateTime).getHours()+""; //map keys need to be string to be properly ser/deser when stored in dynamo
    var statistic = prevStats.byHour.get(statsHour)??new Statistic();
    statistic.activity+=newActivityForHour;
    prevStats.byHour.set(statsHour, statistic);

    return prevStats;
}
