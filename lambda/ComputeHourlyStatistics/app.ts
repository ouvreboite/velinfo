import "reflect-metadata";
import {DynamoDBStreamEvent} from "aws-lambda";
import {getHourlyStats, updateHourlyStats} from "../common/repository/hourlyStatsDynamoRepository";
import {StationsFetchedAvailabilities, StationsHourlyStatistics, StationStatistic} from "../common/domain";
import {extractStationsFetchedAvailabilities} from "../common/dynamoEventExtractor";
import {stripToHour} from "../common/dateUtil";

export const lambdaHandler = async (event: DynamoDBStreamEvent) => {
    var currentStationsAvailabilities = extractStationsFetchedAvailabilities(event);
    if(!currentStationsAvailabilities.fetchDateTime){
        console.error("No fetchDateTime in event, pass");
        return;
    }

    var prevStats = await getHourlyStats(currentStationsAvailabilities.fetchDateTime);
    var statisticsMap = buildStatisticMap(currentStationsAvailabilities, prevStats);
    var hourlyStats = buildHourlyStatistics(statisticsMap, currentStationsAvailabilities.fetchDateTime);
    await updateHourlyStats(hourlyStats);
}

function buildHourlyStatistics(statisticsMap: Map<string, StationStatistic>, fetchDateTime: Date): StationsHourlyStatistics{
    var statsHour = stripToHour(fetchDateTime)
    var totalActivity = computeTotalActivity(statisticsMap);

    var hourlyStats = new StationsHourlyStatistics();
    hourlyStats.byStationCode = statisticsMap;
    hourlyStats.statsDateTime = statsHour;
    hourlyStats.lastFetchDateTime = fetchDateTime;
    hourlyStats.totalActivity = totalActivity;
    return hourlyStats;
}

function buildStatisticMap(fetchedAvailabilities: StationsFetchedAvailabilities, prevStats: StationsHourlyStatistics): Map<string, StationStatistic> {
    var statisticsMap: Map<string, StationStatistic> = new Map();
    
    for (const stationCode of fetchedAvailabilities.byStationCode.keys()) {
        var availability = fetchedAvailabilities.byStationCode.get(stationCode);
        if (prevStats === undefined || !prevStats.byStationCode.has(availability.stationCode)) {
            statisticsMap.set(
                availability.stationCode,{
                activity: availability.activity,
                minElectrical: availability.electrical,
                minMechanical: availability.mechanical,
                minEmpty: availability.empty
            });
        }
        else {
            var prevStat = prevStats.byStationCode.get(availability.stationCode);
            var emptySlots = availability.empty;
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

function computeTotalActivity(statisticsMap:  Map<string, StationStatistic>) : number{
    return Array.from(statisticsMap.values())
    .map(s => s.activity)
    .reduce(function(a, b){
        return a + b;
    }, 0);
}
