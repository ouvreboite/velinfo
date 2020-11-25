import "reflect-metadata";
import { DynamoDBStreamEvent } from "aws-lambda";
import { StationsExpectedActivities, StationAvailability, Statistic, ExpectedActivity, StationsFetchedAvailabilities } from "../../common/domain";
import { extractStationsFetchedAvailabilities } from "../../common/dynamoEventExtractor";
import { getHourlyStats } from "../../common/repository/hourlyStatsDynamoRepository";
import { getExpectedColdActivities, updateExpectedColdActivities } from "../../common/repository/expectedColdActivitiesRepository";
import { deltaSeconds } from "../../common/dateUtil";

export const lambdaHandler = async (event: DynamoDBStreamEvent) => {
    let availabilities = extractStationsFetchedAvailabilities(event);
    let [medianPastActivities, previousExpectedActivities] = await Promise
        .all([getMedianPastActivitiesForSameHourAndDay(availabilities.fetchDateTime), getExpectedColdActivities()])

    if (previousExpectedActivities === undefined) { //special case for first run
        let expectedActivities = new StationsExpectedActivities();
        expectedActivities.fetchDateTime = availabilities.fetchDateTime;
        updateExpectedColdActivities(expectedActivities)
        return;
    }

    let expectedActivities = buildExpectedActivities(previousExpectedActivities, availabilities, medianPastActivities);
    await updateExpectedColdActivities(expectedActivities)

}

function buildExpectedActivities(previousExpectedActivities: StationsExpectedActivities, availabilities: StationsFetchedAvailabilities, medianPastActivities: Map<string, number>): StationsExpectedActivities {
    let expectedActivities = new StationsExpectedActivities();
    expectedActivities.fetchDateTime = availabilities.fetchDateTime;
    let delta = deltaSeconds(expectedActivities.fetchDateTime, previousExpectedActivities.fetchDateTime);

    availabilities.byStationCode.forEach((availability, stationCode) => {
        let expectedActivity = buildExpectedActivity(
            availability, previousExpectedActivities.byStationCode.get(stationCode),
            delta, medianPastActivities
        );
        expectedActivities.byStationCode.set(stationCode, expectedActivity);
    });

    return expectedActivities;
}

function buildExpectedActivity(availability: StationAvailability, prevExpectedActivity: ExpectedActivity, delta: number, expectedActivitiesForHour: Map<string, number>): ExpectedActivity {
    if (!availability.coldSince) {
        return new ExpectedActivity();
    }

    let expectedActivity = new ExpectedActivity();
    expectedActivity.coldSince = availability.coldSince;
    let expectedActivityOnDelta = (expectedActivitiesForHour.get(availability.stationCode) || 60) * delta / 3600
    if (prevExpectedActivity && prevExpectedActivity.value) {
        expectedActivity.value = prevExpectedActivity.value + expectedActivityOnDelta;
    } else {
        expectedActivity.value = expectedActivityOnDelta;
    }

    return expectedActivity;
}

async function getMedianPastActivitiesForSameHourAndDay(date: Date): Promise<Map<string, number>> {
    date.setDate(date.getDate() - 1);
    let oneWeekAgoPromise = getHourlyStats(date)

    date.setDate(date.getDate() - 1);
    let twoWeekAgoPromise = getHourlyStats(date)

    date.setDate(date.getDate() - 1);
    let threeWeekAgoPromise = getHourlyStats(date)

    date.setDate(date.getDate() - 1);
    let fourWeekAgoPromise = getHourlyStats(date)

    let [oneWeekAgo, twoWeekAgo, threeWeekAgo, fourWeekAgo] = await Promise
        .all([oneWeekAgoPromise, twoWeekAgoPromise, threeWeekAgoPromise, fourWeekAgoPromise])

    let pastActivities = new Map<string, number[]>();

    if (oneWeekAgo)
        appendActivities(oneWeekAgo.byStationCode, pastActivities);
    if (twoWeekAgo)
        appendActivities(twoWeekAgo.byStationCode, pastActivities);
    if (threeWeekAgo)
        appendActivities(threeWeekAgo.byStationCode, pastActivities);
    if (fourWeekAgo)
        appendActivities(fourWeekAgo.byStationCode, pastActivities);

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
    return Object.keys(mapOfArray)
        .reduce(function (medians, key) {
            let arr = mapOfArray.get(key);
            if (arr.length == 0) {
                medians.set(key, 0);
            }
            else {
                let arrSort = arr.sort();
                let mid = Math.ceil(arr.length / 2);
                let median = arr.length % 2 == 0 ? (arrSort[mid] + arrSort[mid - 1]) / 2 : arrSort[mid - 1];
                medians.set(key, median);
            }

            return medians;
        }, new Map());
}