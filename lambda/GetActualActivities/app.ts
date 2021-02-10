import { classToPlain } from "class-transformer";
import "reflect-metadata";
import { Activities, HourlyActivity } from "../common/api";
import { toParisTZ } from "../common/dateUtil";
import { StationsHourlyStatistics } from "../common/domain";
import { getStationHourlyStatsForDay } from "../common/repository/hourlyStatsDynamoRepository";

export const lambdaHandler = async () => {
    let hourlyStats = await getStationHourlyStatsForDay(new Date());  
    console.log(hourlyStats.length);
    let todaysActivities = map(hourlyStats);

    return {
        statusCode: 200,
        headers:{
            "Access-Control-Allow-Origin": 'https://www.velinfo.fr',
        },
        body: JSON.stringify(classToPlain(todaysActivities)),
        isBase64Encoded: false
    };
}

function map(hourlyStats: StationsHourlyStatistics[]): Activities{
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
    byStationCode.forEach((hourlyExpectedActivities, stationCode)=>{
        let hourlyExpectedActivity = {
            stationCode: stationCode,
            hourlyActivity: hourlyExpectedActivities
        } as HourlyActivity;
        activities.hourlyActivities.push(hourlyExpectedActivity);
    });
    return activities;
}