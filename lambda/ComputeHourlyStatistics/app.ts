import "reflect-metadata";
import {DynamoDBStreamEvent} from "aws-lambda";
import {getStationHourlyStats, updateStationHourlyStats} from "../common/repository/hourlyStatsDynamoRepository";
import {StationsFetchedAvailabilities, StationsHourlyStatistics, StationsUsageStatistics, Statistic} from "../common/domain";
import {extractDynamoEvent} from "../common/dynamoEventExtractor";
import {stripToHour, toParisTZ} from "../common/dateUtil";
import { getStationUsageStats, updateStationUsageStats } from "../common/repository/stationUsageStatsDynamoRepository";

export const lambdaHandler = async (event: DynamoDBStreamEvent) => {
    var currentStationsAvailabilities = extractDynamoEvent(StationsFetchedAvailabilities, event);
    if(!currentStationsAvailabilities.fetchDateTime){
        console.error("No fetchDateTime in event, pass");
        return;
    }

    var prevStats = await getStationHourlyStats(currentStationsAvailabilities.fetchDateTime);
    var statisticsMap = buildStatisticMap(currentStationsAvailabilities, prevStats?.byStationCode);
    var hourlyStats = buildHourlyStatistics(statisticsMap, currentStationsAvailabilities.fetchDateTime);
    await updateStationHourlyStats(hourlyStats);

    //usage stats (smaller increment)
    var prevUsageStats = await getStationUsageStats(currentStationsAvailabilities.fetchDateTime);
    var usageStatisticsMap = buildStatisticMap(currentStationsAvailabilities, prevUsageStats?.byStationCode);
    var usageStatistics = buildUsageStatistics(usageStatisticsMap);
    await updateStationUsageStats(usageStatistics, currentStationsAvailabilities.fetchDateTime);
}

function buildHourlyStatistics(statisticsMap: Map<string, Statistic>, fetchDateTime: Date): StationsHourlyStatistics{
    var statsHour = stripToHour(fetchDateTime)
    var parisHour = toParisTZ(fetchDateTime).getHours();
    var totalActivity = computeTotalActivity(statisticsMap);

    var hourlyStats = new StationsHourlyStatistics();
    hourlyStats.byStationCode = statisticsMap;
    hourlyStats.statsDateTime = statsHour;
    hourlyStats.hour = parisHour;
    hourlyStats.lastFetchDateTime = fetchDateTime;
    hourlyStats.totalActivity = totalActivity;
    return hourlyStats;
}


function buildUsageStatistics(statisticsMap: Map<string, Statistic>): StationsUsageStatistics{
    var totalActivity = computeTotalActivity(statisticsMap);
    var hourlyStats = new StationsUsageStatistics();
    hourlyStats.byStationCode = statisticsMap;
    hourlyStats.totalActivity = totalActivity;
    return hourlyStats;
}

function buildStatisticMap(fetchedAvailabilities: StationsFetchedAvailabilities, prevStats: Map<string, Statistic>): Map<string, Statistic> {
    var statisticsMap: Map<string, Statistic> = new Map();
    
    for (const stationCode of fetchedAvailabilities.byStationCode.keys()) {
        var availability = fetchedAvailabilities.byStationCode.get(stationCode);
        if (prevStats === undefined || !prevStats.has(availability.stationCode)) {
            statisticsMap.set(
                availability.stationCode,{
                activity: availability.activity
            });
        }
        else {
            var prevStat = prevStats.get(availability.stationCode);
            var activity = availability.activity + prevStat.activity;
            statisticsMap.set(availability.stationCode, {
                activity: activity
            });
        }
    }

    return statisticsMap;
}

function computeTotalActivity(statisticsMap:  Map<string, Statistic>) : number{
    return Array.from(statisticsMap.values())
    .map(s => s.activity)
    .reduce(function(a, b){
        return a + b;
    }, 0);
}
