import "reflect-metadata";

import { APIGatewayProxyEvent } from "aws-lambda";
import { classToPlain } from "class-transformer";

import { Activities } from "../common/api";
import { buildHeaders } from "../common/corsHeadersUtil";
import { StationsUsageStatistics } from "../common/domain/statistic";
import { getStationUsageStatsForDay } from "../common/repository/stationUsageStatsRepository";

export const lambdaHandler = async (event: APIGatewayProxyEvent) => {
    var today = new Date();
    let usageStats = await getStationUsageStatsForDay(today);

    let todaysActivities = map(usageStats);

    return {
        statusCode: 200,
        headers: buildHeaders(event.headers),
        body: JSON.stringify(classToPlain(todaysActivities)),
        isBase64Encoded: false
    };
}

function map(usageStats : StationsUsageStatistics[]): Activities{
    let byStationCode = new Map<string, number[]>();
    let activities = new Activities();

    //downgrade the usage 30 minutes aggregation for lighter payload
    byStationCode = new Map<string, number[]>();
    usageStats.forEach(stats => {
        let hour = parseInt(stats.timeslot.split(':')[0], 10);
        let minute = parseInt(stats.timeslot.split(':')[1], 10);
        let index = 2*hour+Math.floor(minute/30);

        stats.byStationCode.forEach((stat, stationCode)=>{
            if(!byStationCode.get(stationCode)){
                byStationCode.set(stationCode, Array(Math.ceil(usageStats.length/3)).fill(0));
            }
            byStationCode.get(stationCode)[index]+=stat.activity;
        });
    });
    byStationCode.forEach((activityArray, stationCode)=>{
        activities.accurateActivities.push({
            stationCode: stationCode,
            activity: activityArray
        });
    });

    return activities;
}