import "reflect-metadata";
import { ExpectedActivities } from "../common/api";
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
        body: JSON.stringify(todaysExpectedActivities),
        isBase64Encoded: false
    };
}

function mapToExpectedActivities(hourlyExpectedActivities: StationsExpectedActivities[]): ExpectedActivities{
    let todaysExpectedActivities = new ExpectedActivities();
    hourlyExpectedActivities.forEach(activities => {
        activities.byStationCode.forEach((expected, stationCode)=>{
            if(!todaysExpectedActivities.byStationCode.get(stationCode)){
                todaysExpectedActivities.byStationCode.set(stationCode, Array(6).fill(0));
            }
            todaysExpectedActivities.byStationCode.get(stationCode)[activities.hour]=expected.expectedActivity;
        });
    });
    return todaysExpectedActivities;
}