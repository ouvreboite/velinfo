import "reflect-metadata";
import { Statistic, StationMedianUsage } from "../common/domain";
import { buildTimeSlot, toParisTZ } from "../common/dateUtil";
import { getStationUsageStats } from "../common/repository/stationUsageStatsDynamoRepository";
import { updateMedianUsage } from "../common/repository/medianUsageRepository";

export const lambdaHandler = async (event: any) => {

    let oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours()-1);
    oneHourAgo.setMinutes(oneHourAgo.getMinutes()-5);

    let medianPastUsages = await getMedianPastUsageForSameTimeslotAndDay(oneHourAgo);

    let medianUsage = buildMedianUsage(oneHourAgo, medianPastUsages);
    await updateMedianUsage(medianUsage)
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