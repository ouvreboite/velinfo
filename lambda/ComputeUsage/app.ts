import "reflect-metadata";
import {DynamoDBStreamEvent} from "aws-lambda";
import {StationsContent, StationsUsageStatistics, Statistic} from "../common/domain";
import {extractDynamoEvent} from "../common/dynamoEventExtractor";
import { getStationUsageStats, updateStationUsageStats } from "../common/repository/stationUsageStatsDynamoRepository";

export const lambdaHandler = async (event: DynamoDBStreamEvent) => {
    var currentStationsContent = extractDynamoEvent(StationsContent, event);
    if(!currentStationsContent.fetchDateTime){
        console.error("No fetchDateTime in event, pass");
        return;
    }
    var prevUsageStats = await getStationUsageStats(currentStationsContent.fetchDateTime);
    var usageStatisticsMap = buildStatisticMap(currentStationsContent, prevUsageStats?.byStationCode);
    var usageStatistics = buildUsageStatistics(usageStatisticsMap);
    await updateStationUsageStats(usageStatistics, currentStationsContent.fetchDateTime);
}

function buildUsageStatistics(statisticsMap: Map<string, Statistic>): StationsUsageStatistics{
    var hourlyStats = new StationsUsageStatistics();
    hourlyStats.byStationCode = statisticsMap;
    hourlyStats.totalActivity = computeTotalActivity(statisticsMap);
    return hourlyStats;
}

function buildStatisticMap(stationsContent: StationsContent, prevStats: Map<string, Statistic>): Map<string, Statistic> {
    var statisticsMap: Map<string, Statistic> = new Map();
    
    for (const stationCode of stationsContent.byStationCode.keys()) {
        var content = stationsContent.byStationCode.get(stationCode);
        if (prevStats === undefined || !prevStats.has(content.stationCode)) {
            statisticsMap.set(
                content.stationCode,{
                activity: content.activity
            });
        }
        else {
            var prevStat = prevStats.get(content.stationCode);
            var activity = content.activity + prevStat.activity;
            if(isNaN(activity)){
                console.error("activity NaN");
                console.log(stationCode);
                activity = 0;
            }
            statisticsMap.set(content.stationCode, {
                activity: activity
            });
          
        }
    }

    return statisticsMap;
}

function computeTotalActivity(statisticsMap:  Map<string, Statistic>) : number{
    return Array.from(statisticsMap.values())
    .map(s => s.activity)
    .filter(activity => !isNaN(activity))
    .reduce(function(a, b){
        return a + b;
    }, 0);
}
