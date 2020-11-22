import "reflect-metadata";
import {DynamoDBStreamEvent} from "aws-lambda";
import {getHourlyStats, updateHourlyStats} from "../../common/repository/hourlyStatsDynamoRepository";
import {StationsFetchedAvailabilities, StationsHourlyStatistics, Statistic} from "../../common/domain";
import {extractStationsFetchedAvailabilities} from "../../common/dynamoEventExtractor";
import {stripToHour} from "../../common/dateUtil";

export const lambdaHandler = async (event: DynamoDBStreamEvent) => {
    var currentStationsAvailabilities = extractStationsFetchedAvailabilities(event);
    var statsHour = stripToHour(currentStationsAvailabilities.fetchDateTime)
    var prevStats = await getHourlyStats(currentStationsAvailabilities.fetchDateTime);
    var statisticsMap = buildStatisticMap(currentStationsAvailabilities, prevStats);
    var hourlyStats = buildHourlyStatistics(statisticsMap, statsHour, currentStationsAvailabilities.fetchDateTime);
    await updateHourlyStats(hourlyStats);
}

function buildHourlyStatistics(statisticsMap: Map<string, Statistic>, statsHour: Date, fetchDateTime: Date): StationsHourlyStatistics{
    var totalActivity = computeTotalActivity(statisticsMap);

    var hourlyStats = new StationsHourlyStatistics();
    hourlyStats.byStationCode = statisticsMap;
    hourlyStats.statsDateTime = statsHour;
    hourlyStats.statsDay = statsHour.toISOString().substring(0,10);
    hourlyStats.lastFetchDateTime = fetchDateTime;
    hourlyStats.totalActivity = totalActivity;
    return hourlyStats;
}

function buildStatisticMap(fetchedAvailabilities: StationsFetchedAvailabilities, prevStats: StationsHourlyStatistics): Map<string, Statistic> {
    var statisticsMap: Map<string, Statistic> = new Map();
    
    for (const stationCode of fetchedAvailabilities.byStationCode.keys()) {
        var availability = fetchedAvailabilities.byStationCode.get(stationCode);
        if (prevStats === undefined || !prevStats.byStationCode.has(availability.stationCode)) {
            statisticsMap.set(
                availability.stationCode,{
                activity: availability.activity,
                minElectrical: availability.electrical,
                minMechanical: availability.mechanical,
                minEmpty: availability.capacity - (availability.electrical + availability.mechanical)
            });
        }
        else {
            var prevStat = prevStats.byStationCode.get(availability.stationCode);
            var emptySlots = availability.capacity - (availability.electrical + availability.mechanical);
            var activity = availability.activity + prevStat.activity;
            statisticsMap.set(availability.stationCode, {
                activity: activity,
                minElectrical: Math.min(availability.electrical, prevStat.minElectrical),
                minMechanical: Math.min(availability.mechanical, prevStat.minMechanical),
                minEmpty: Math.min(emptySlots, prevStat.minEmpty)
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
