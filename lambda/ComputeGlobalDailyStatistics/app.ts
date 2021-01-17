import "reflect-metadata";
import {DynamoDBStreamEvent} from "aws-lambda";
import {GlobalDailyStatistics, StationsFetchedAvailabilities, StationsHourlyStatistics, StationStatistic, Statistic} from "../../common/domain";
import {extractStationsFetchedAvailabilities} from "../../common/dynamoEventExtractor";
import { getGlobalDailyStats, updateGlobalDailyStats } from "../../common/repository/globalDailyStatsDynamoRepository";
import { toParisHour } from "../../common/dateUtil";

export const lambdaHandler = async (event: DynamoDBStreamEvent) => {
    var currentStationsAvailabilities = extractStationsFetchedAvailabilities(event);
    if(!currentStationsAvailabilities.fetchDateTime){
        console.error("No fetchDateTime in event, pass");
        return;
    }

    var prevStats = await getGlobalDailyStats(currentStationsAvailabilities.fetchDateTime);
    var stats = buildStatistics(currentStationsAvailabilities, prevStats);
    await updateGlobalDailyStats(stats);
}

function buildStatistics(fetchedAvailabilities: StationsFetchedAvailabilities, prevStats: GlobalDailyStatistics): GlobalDailyStatistics {
    if(!prevStats){
        prevStats = new GlobalDailyStatistics();
        prevStats.totalActivity = 0;
        prevStats.firstFetchDateTime = fetchedAvailabilities.fetchDateTime;
    }

    var newActivityForHour = 0;
    for (const availability of fetchedAvailabilities.byStationCode.values()) {
        newActivityForHour += Math.abs(availability.deltaElectrical);
        newActivityForHour += Math.abs(availability.deltaMechanical);
    }

    prevStats.totalActivity+=newActivityForHour;

    var statsHour = toParisHour(fetchedAvailabilities.fetchDateTime)+""; //map keys need to be string to be properly ser/deser when stored in dynamo
    var hourStat = prevStats.byHour.get(statsHour)??new Statistic();
    hourStat.activity+=newActivityForHour;
    prevStats.byHour.set(statsHour, hourStat);

    return prevStats;
}
