import { classToPlain } from "class-transformer";
import "reflect-metadata";
import { Activities } from "../common/api";
import { toParisTZ } from "../common/dateUtil";
import { StationsHourlyStatistics, StationsUsageStatistics } from "../common/domain";
import { getStationHourlyStatsForDay } from "../common/repository/hourlyStatsDynamoRepository";
import { getStationUsageStatsForDay } from "../common/repository/stationUsageStatsDynamoRepository";

export const lambdaHandler = async () => {
    var today = new Date();
    let [hourlyStats, usageStats] = await Promise.all([
        getStationHourlyStatsForDay(today), getStationUsageStatsForDay(today)
    ]);  

    let todaysActivities = map(hourlyStats, usageStats);

    return {
        statusCode: 200,
        headers:{
            "Access-Control-Allow-Origin": 'https://www.velinfo.fr',
        },
        body: JSON.stringify(classToPlain(todaysActivities)),
        isBase64Encoded: false
    };
}

function map(hourlyStats: StationsHourlyStatistics[], usageStats : StationsUsageStatistics[]): Activities{
    let byStationCode = new Map<string, number[]>();
    hourlyStats.forEach(stats => {
        var parisHour = toParisTZ(stats.lastFetchDateTime).getHours();
        stats.byStationCode.forEach((stat, stationCode)=>{
            if(!byStationCode.get(stationCode)){
                byStationCode.set(stationCode, Array(hourlyStats.length).fill(0));
            }
            byStationCode.get(stationCode)[parisHour]=stat.activity;
        });
    });

    let activities = new Activities();
    byStationCode.forEach((hourlyActivities, stationCode)=>{
        activities.hourlyActivities.push({
            stationCode: stationCode,
            activity: hourlyActivities
        });
    });

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