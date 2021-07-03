import { classToPlain } from "class-transformer";
import "reflect-metadata";
import { Activities } from "../common/api";
import { StationsUsageStatistics } from "../common/domain/statistic";
import { getStationUsageStatsForDay } from "../common/repository/stationUsageStatsDynamoRepository";

export const lambdaHandler = async () => {
    var today = new Date();
    let usageStats = await getStationUsageStatsForDay(today);

    let todaysActivities = map(usageStats);

    return {
        statusCode: 200,
        headers:{
            "Access-Control-Allow-Origin": 'https://www.velinfo.fr',
        },
        body: JSON.stringify(classToPlain(todaysActivities)),
        isBase64Encoded: false
    };
}

function map(usageStats : StationsUsageStatistics[]): Activities{
    let byStationCode = new Map<string, number[]>();
    let activities = new Activities();

    //downgrade the usage from 5 minutes to 15 minutes aggregation for lighter payload
    byStationCode = new Map<string, number[]>();
    usageStats.forEach(stats => {
        let hour = parseInt(stats.timeslot.split(':')[0], 10);
        let minute = parseInt(stats.timeslot.split(':')[1], 10);
        let index = 4*hour+Math.floor(minute/15);

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