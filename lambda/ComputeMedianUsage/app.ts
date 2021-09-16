import "reflect-metadata";
import { buildTimeSlot, toParisTZ } from "../common/dateUtil";
import { NetworkDailyUsagePredictions, StationMedianUsage } from "../common/domain/station-usage";
import { Statistic } from "../common/domain/statistic";
import { updateMedianUsage } from "../common/repository/medianUsageRepository";
import { getStationUsageStats } from "../common/repository/stationUsageStatsRepository";

import { getNetworkDailyUsagePredictions, updateNetworkDailyUsagePredictions } from "../common/repository/dailyNetworkUsagePredictionsRepository";

export const lambdaHandler = async (event: any) => {

    let oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate()-1);


    let [medianPastUsages, prevDailyNetworkUsagePredictions] = await Promise.all([
        getMedianPastUsageForSameTimeslotAndDay(oneDayAgo), 
        getNetworkDailyUsagePredictions(oneDayAgo)]);

    let medianUsage = buildMedianUsage(oneDayAgo, medianPastUsages);
    await updateMedianUsage(medianUsage);

    var dailyNetworkUsagePredictions = buildDailyNetworkUsagePredictions(prevDailyNetworkUsagePredictions, medianUsage);
    await updateNetworkDailyUsagePredictions(dailyNetworkUsagePredictions, oneDayAgo);
}

function buildMedianUsage(date: Date, medianPastUsages: Map<string, number>): StationMedianUsage {
    let medianUsage = new StationMedianUsage();
    medianUsage.weekday = toParisTZ(date).getDay();
    medianUsage.timeslot = buildTimeSlot(date);

    medianPastUsages.forEach((median, stationCode)=>{
        medianUsage.byStationCode.set(stationCode, {
            activity: median
        })
    })

    return medianUsage;
}

async function getMedianPastUsageForSameTimeslotAndDay(date: Date): Promise<Map<string, number>> {
    var date = new Date(date.getTime());

    date.setDate(date.getDate());
    let todayPromise = getStationUsageStats(date)

    date.setDate(date.getDate() - 7);
    let oneWeekAgoPromise = getStationUsageStats(date)

    date.setDate(date.getDate() - 7);
    let twoWeekAgoPromise = getStationUsageStats(date)

    date.setDate(date.getDate() - 7);
    let threeWeekAgoPromise = getStationUsageStats(date)

    let [today, oneWeekAgo, twoWeekAgo, threeWeekAgo] = await Promise
        .all([todayPromise, oneWeekAgoPromise, twoWeekAgoPromise, threeWeekAgoPromise])

    let pastActivities = new Map<string, number[]>();

    if (today)
    appendActivities(today.byStationCode, pastActivities);
    if (oneWeekAgo)
        appendActivities(oneWeekAgo.byStationCode, pastActivities);
    if (twoWeekAgo)
        appendActivities(twoWeekAgo.byStationCode, pastActivities);
    if (threeWeekAgo)
        appendActivities(threeWeekAgo.byStationCode, pastActivities);

    return median(pastActivities);
}

function appendActivities(statistics: Map<string, Statistic>, activities: Map<string, number[]>) {
    statistics.forEach((statistic, stationCode) => {
        if (activities.has(stationCode))
            activities.get(stationCode).push(statistic.activity);
        else
            activities.set(stationCode, [statistic.activity])
    });
}


function median(mapOfArray: Map<string, number[]>): Map<string, number> {
    var medianMap = new Map<string, number>();
    mapOfArray.forEach(function (arr, key) {
        if (arr.length == 0) {
            medianMap.set(key, 0);
        }
        else {
            let arrSort = arr.sort();
            let mid = Math.ceil(arr.length / 2);
            let median = arr.length % 2 == 0 ? (arrSort[mid] + arrSort[mid - 1]) / 2 : arrSort[mid - 1];
            medianMap.set(key, median);
        }
    });
    return medianMap;
}


function buildDailyNetworkUsagePredictions(previousPredictions: NetworkDailyUsagePredictions, medianUsage: StationMedianUsage): NetworkDailyUsagePredictions{
    let networkPredictions = previousPredictions ?? new NetworkDailyUsagePredictions();
    
    const medianActivityOnSlot = Array.from(medianUsage.byStationCode.values())
    .map((usage) => usage.activity)
    .reduce((prev, curr)=> curr + prev, 0);
   
    networkPredictions.byTimeSlot.set(medianUsage.timeslot, {activity:medianActivityOnSlot});

    const totalMedianActivity = Array.from(networkPredictions.byTimeSlot.values())
    .map((usage) => usage.activity)
    .reduce((prev, curr)=> curr + prev, 0);

    networkPredictions.totalActivity = totalMedianActivity;
    
    return networkPredictions;
}