import { classToPlain } from "class-transformer";
import "reflect-metadata";
import { Activities, HourlyActivity } from "../common/api";
import { StationsExpectedActivities } from "../common/domain";
import { getExpectedHourlyActivitiesForDay } from "../common/repository/expectedActivitiesRepository";

export const lambdaHandler = async () => {
    let hourlyExpectedActivities = await getExpectedHourlyActivitiesForDay(new Date());  

    let todaysExpectedActivities = map(hourlyExpectedActivities);

    return {
        statusCode: 200,
        headers:{
            "Access-Control-Allow-Origin": 'https://www.velinfo.fr',
        },
        body: JSON.stringify(classToPlain(todaysExpectedActivities)),
        isBase64Encoded: false
    };
}

function map(hourlyExpectedActivities: StationsExpectedActivities[]): Activities{
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
            hourlyActivity: hourlyExpectedActivities
        } as HourlyActivity;
        expectedActivities.hourlyActivities.push(hourlyExpectedActivity);
    });
    return expectedActivities;
}