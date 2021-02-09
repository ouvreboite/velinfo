import { classToPlain } from "class-transformer";
import "reflect-metadata";
import { ExpectedActivities, HourlyExpectedActivity } from "../common/api";
import { StationsExpectedActivities } from "../common/domain";
import { getExpectedHourlyActivitiesForDay } from "../common/repository/expectedActivitiesRepository";

export const lambdaHandler = async () => {
    let hourlyExpectedActivities = await getExpectedHourlyActivitiesForDay(new Date());  

    let todaysExpectedActivities = mapToExpectedActivities(hourlyExpectedActivities);

    return {
        statusCode: 200,
        headers:{
            "Access-Control-Allow-Origin": 'https://www.velinfo.fr',
        },
        body: JSON.stringify(classToPlain(todaysExpectedActivities)),
        isBase64Encoded: false
    };
}

function mapToExpectedActivities(hourlyExpectedActivities: StationsExpectedActivities[]): ExpectedActivities{
    let byStationCode = new Map<string, number[]>();
    hourlyExpectedActivities.forEach(activities => {
        activities.byStationCode.forEach((expected, stationCode)=>{
            if(!byStationCode.get(stationCode)){
                byStationCode.set(stationCode, Array(24).fill(0));
            }
            byStationCode.get(stationCode)[activities.hour]=expected.expectedActivity;
        });
    });

    let expectedActivities = new ExpectedActivities();
    byStationCode.forEach((hourlyExpectedActivities, stationCode)=>{
        let hourlyExpectedActivity = {
            stationCode: stationCode,
            hourlyExpectedActivity: hourlyExpectedActivities
        } as HourlyExpectedActivity;
        expectedActivities.hourlyExpectedActivities.push(hourlyExpectedActivity);
    });
    return expectedActivities;
}