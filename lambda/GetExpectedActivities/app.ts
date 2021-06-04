import { classToPlain } from "class-transformer";
import "reflect-metadata";
import { Activities, Activity } from "../common/api";
import { StationMedianUsage, StationsExpectedActivities } from "../common/domain";
import { getExpectedHourlyActivitiesForDay } from "../common/repository/expectedActivitiesRepository";
import { getMedianUsagesForDay } from "../common/repository/medianUsageRepository";

export const lambdaHandler = async () => {
    let today = new Date();
    let [hourlyExpectedActivities, medianUsages] = await Promise.all([
        getExpectedHourlyActivitiesForDay(today), getMedianUsagesForDay(today)
    ]);  

    let todaysExpectedActivities = map(hourlyExpectedActivities, medianUsages);

    return {
        statusCode: 200,
        headers:{
            "Access-Control-Allow-Origin": 'https://www.velinfo.fr',
        },
        body: JSON.stringify(classToPlain(todaysExpectedActivities)),
        isBase64Encoded: false
    };
}

function map(hourlyExpectedActivities: StationsExpectedActivities[], medianUsages: StationMedianUsage[]): Activities{
    let byStationCode = new Map<string, number[]>();
    hourlyExpectedActivities.forEach(activities => {
        activities.byStationCode.forEach((expected, stationCode)=>{
            if(!byStationCode.get(stationCode)){
                byStationCode.set(stationCode, Array(24).fill(0));
            }
            byStationCode.get(stationCode)[activities.hour]=expected.expectedActivity;
        });
    });

    let expectedActivities = new Activities();
    byStationCode.forEach((hourlyExpectedActivities, stationCode)=>{
        let hourlyExpectedActivity = {
            stationCode: stationCode,
            activity: hourlyExpectedActivities
        } as Activity;
        expectedActivities.hourlyActivities.push(hourlyExpectedActivity);
    });

    //downgrade the usage from 5 minutes to 15 minutes aggregation for lighter payload
    byStationCode = new Map<string, number[]>();
    medianUsages.forEach(stats => {
        let hour = parseInt(stats.timeslot.split(':')[0], 10);
        let minute = parseInt(stats.timeslot.split(':')[1], 10);
        let index = 4*hour+Math.floor(minute/15);

        stats.byStationCode.forEach((stat, stationCode)=>{
            if(!byStationCode.get(stationCode)){
                byStationCode.set(stationCode, Array(Math.ceil(medianUsages.length/3)).fill(0));
            }
            byStationCode.get(stationCode)[index]+=stat.activity;
        });
    });
    byStationCode.forEach((activityArray, stationCode)=>{
        expectedActivities.accurateActivities.push({
            stationCode: stationCode,
            activity: activityArray
        });
    });

    return expectedActivities;
}