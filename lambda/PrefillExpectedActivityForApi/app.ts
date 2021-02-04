import "reflect-metadata";
import { ExpectedActivities} from "../common/api";
import { StationsExpectedActivities } from "../common/domain";
import { getExpectedHourlyActivitiesForDay } from "../common/repository/expectedActivitiesRepository";
import { updateExpectedActivities } from "../common/repository/prefilledApiRepository";

export const lambdaHandler = async () => {
    let yesterday = new Date();
    yesterday.setDate(new Date().getDate()-1);
    let hourlyExpectedActivities = await getExpectedHourlyActivitiesForDay(yesterday);

    let todaysExpectedActivities = mapToExpectedActivities(hourlyExpectedActivities);

    await updateExpectedActivities(todaysExpectedActivities);
}

function mapToExpectedActivities(hourlyExpectedActivities: StationsExpectedActivities[]): ExpectedActivities{
    let todaysExpectedActivities = new ExpectedActivities();
    hourlyExpectedActivities.forEach(activities => {
        console.log(activities.hour);
        activities.byStationCode.forEach((expected, stationCode)=>{
            if(!todaysExpectedActivities.byStationCode.get(stationCode)){
                todaysExpectedActivities.byStationCode.set(stationCode, Array(6).fill(0));
            }
            todaysExpectedActivities.byStationCode.get(stationCode)[activities.hour]=expected.expectedActivity;
        });
    });
    return todaysExpectedActivities;
}