import "reflect-metadata";
import { Statistic, StationsExpectedActivities } from "../common/domain";
import { getStationHourlyStats } from "../common/repository/hourlyStatsDynamoRepository";
import { toParisTZ } from "../common/dateUtil";
import { updateExpectedHourlyActivities } from "../common/repository/expectedActivitiesRepository";

export const lambdaHandler = async (event: any) => {

    let oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours()-1);
    oneHourAgo.setMinutes(oneHourAgo.getMinutes()-5);

    let medianPastActivities = await getMedianPastActivitiesForSameHourAndDay(oneHourAgo);

    let expectedHourlyActivities = buildExpectedHourlyActivities(oneHourAgo, medianPastActivities);
    await updateExpectedHourlyActivities(expectedHourlyActivities)

}

function buildExpectedHourlyActivities(date: Date, medianPastActivities: Map<string, number>): StationsExpectedActivities {
    let expectedActivities = new StationsExpectedActivities();
    expectedActivities.weekday = toParisTZ(date).getDay();
    expectedActivities.hour = toParisTZ(date).getHours();

    medianPastActivities.forEach((median, stationCode)=>{
        expectedActivities.byStationCode.set(stationCode, {
            expectedActivity: median
        })
    })

    return expectedActivities;
}

async function getMedianPastActivitiesForSameHourAndDay(date: Date): Promise<Map<string, number>> {
    var date = new Date(date.getTime());

    date.setDate(date.getDate());
    let todayPromise = getStationHourlyStats(date)

    date.setDate(date.getDate() - 7);
    let oneWeekAgoPromise = getStationHourlyStats(date)

    date.setDate(date.getDate() - 7);
    let twoWeekAgoPromise = getStationHourlyStats(date)

    date.setDate(date.getDate() - 7);
    let threeWeekAgoPromise = getStationHourlyStats(date)

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