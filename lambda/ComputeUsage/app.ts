import "reflect-metadata";
import { DynamoDBStreamEvent } from "aws-lambda";
import { extractDynamoEvent } from "../common/dynamoEventExtractor";
import { getStationUsageStats, updateStationUsageStats } from "../common/repository/stationUsageStatsDynamoRepository";
import { StationsContent } from "../common/domain/station-content";
import { StationsUsageStatistics, Statistic } from "../common/domain/statistic";

export const lambdaHandler = async (event: DynamoDBStreamEvent) => {
    var currentStationsContent = extractDynamoEvent(StationsContent, event);
    if(!currentStationsContent.dateTime){
        console.error("No dateTime in event, pass");
        return;
    }
    var prevUsageStats = await getStationUsageStats(currentStationsContent.dateTime);
    var usageStatisticsMap = buildStatisticMap(currentStationsContent, prevUsageStats?.byStationCode);
    var usageStatistics = buildUsageStatistics(usageStatisticsMap);
    await updateStationUsageStats(usageStatistics, currentStationsContent.dateTime);
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
        let activity = content.delta?.activity ?? 0;

        if (prevStats != undefined && prevStats.has(content.stationCode)) {
            var prevStat = prevStats.get(content.stationCode);
            activity+=prevStat.activity;
        }

        if(isNaN(activity)){
            console.error("activity NaN for station: "+stationCode);
            activity = 0;
        }

        statisticsMap.set(
            content.stationCode,
            {
                activity: activity
            }
        );
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
