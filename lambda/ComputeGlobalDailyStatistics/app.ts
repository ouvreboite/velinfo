import "reflect-metadata";
import {DynamoDBStreamEvent} from "aws-lambda";
import {extractDynamoEvent} from "../common/dynamoEventExtractor";
import { getGlobalDailyStats, updateGlobalDailyStats } from "../common/repository/globalDailyStatsDynamoRepository";
import { toParisTZ } from "../common/dateUtil";
import { StationsContent } from "../common/domain/station-content";
import { GlobalDailyStatistics, Statistic } from "../common/domain/statistic";

export const lambdaHandler = async (event: DynamoDBStreamEvent) => {
    var currentStationsContent = extractDynamoEvent(StationsContent, event);
    if(!currentStationsContent.dateTime){
        console.error("No dateTime in event, pass");
        return;
    }

    var prevStats = await getGlobalDailyStats(currentStationsContent.dateTime);
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
        prevStats.firstFetchDateTime = stationsContent.dateTime;
    }

    var newActivityForHour = 0;
    for (const content of stationsContent.byStationCode.values()) {   
        newActivityForHour += content.delta?.activity ?? 0;
    }

    prevStats.totalActivity+=newActivityForHour;

    var statsHour = toParisTZ(stationsContent.dateTime).getHours()+""; //map keys need to be string to be properly ser/deser when stored in dynamo
    var statistic = prevStats.byHour.get(statsHour) ?? new Statistic();
    statistic.activity+=newActivityForHour;
    prevStats.byHour.set(statsHour, statistic);

    return prevStats;
}
