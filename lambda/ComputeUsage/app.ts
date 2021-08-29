import "reflect-metadata";
import { DynamoDBStreamEvent } from "aws-lambda";
import { extractDynamoEvent } from "../common/dynamoEventExtractor";
import { getStationUsageStats, updateStationUsageStats } from "../common/repository/stationUsageStatsRepository";
import { StationsContent } from "../common/domain/station-content";
import { NetworkDailyUsageStatistics, StationsUsageStatistics, Statistic } from "../common/domain/statistic";
import { getNetworkDailyUsageStats, updateNetworkDailyUsageStats } from "../common/repository/dailynetworkUsageStatsRepository";
import { buildTimeSlot, toParisDay } from "../common/dateUtil";

export const lambdaHandler = async (event: DynamoDBStreamEvent) => {
    var currentStationsContent = extractDynamoEvent(StationsContent, event);
    if(!currentStationsContent.dateTime){
        console.error("No dateTime in event, pass");
        return;
    }

    let datetime = currentStationsContent.dateTime;

    let [prevStationUsageStats, prevDailyNetworkUsageStats] = await Promise.all([getStationUsageStats(datetime), getNetworkDailyUsageStats(datetime)]);

    var usageStatisticsMap = buildStatisticMap(currentStationsContent, prevStationUsageStats?.byStationCode);
    var stationUsageStats = buildStationUsageStatistics(usageStatisticsMap);
    await updateStationUsageStats(stationUsageStats, currentStationsContent.dateTime);

    var dailyNetworkUsageStats = buildDailyNetworkUsageStatistics(prevDailyNetworkUsageStats, currentStationsContent.dateTime, stationUsageStats.totalActivity);
    await updateNetworkDailyUsageStats(dailyNetworkUsageStats, currentStationsContent.dateTime);
}

function buildStationUsageStatistics(statisticsMap: Map<string, Statistic>): StationsUsageStatistics{
    var hourlyStats = new StationsUsageStatistics();
    hourlyStats.byStationCode = statisticsMap;
    hourlyStats.totalActivity = computeTotalActivity(statisticsMap);
    return hourlyStats;
}

function buildDailyNetworkUsageStatistics(networkDailyUsageStatistics: NetworkDailyUsageStatistics, datetime: Date, activityOnSlot: number): NetworkDailyUsageStatistics{
    networkDailyUsageStatistics = networkDailyUsageStatistics ?? new NetworkDailyUsageStatistics();
    
    let timeslot = buildTimeSlot(datetime);
    networkDailyUsageStatistics.byTimeSlot.set(timeslot, {activity:activityOnSlot});

    let totalActivity = Array.from(networkDailyUsageStatistics.byTimeSlot.values()).map(stat => stat.activity).reduce((prev, cur) => prev+cur);
    networkDailyUsageStatistics.totalActivity = totalActivity;

    return networkDailyUsageStatistics;
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
