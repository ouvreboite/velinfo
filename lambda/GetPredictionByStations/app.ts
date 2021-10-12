import { classToPlain } from "class-transformer";
import "reflect-metadata";
import { Activities } from "../common/api";
import { StationMedianUsage } from "../common/domain/station-usage";
import { getMedianUsagesForDay } from "../common/repository/medianUsageRepository";

export const lambdaHandler = async () => {
    let today = new Date();
    let medianUsages = await getMedianUsagesForDay(today);

    let todaysPredictedActivities = map(medianUsages);
    return {
        statusCode: 200,
        headers:{
            "Access-Control-Allow-Origin": 'https://www.velinfo.fr',
        },
        body: JSON.stringify(classToPlain(todaysPredictedActivities)),
        isBase64Encoded: false
    };
}

function map(medianUsages: StationMedianUsage[]): Activities{
    let byStationCode = new Map<string, number[]>();
    let expectedActivities = new Activities();

    //downgrade the usage 30 minutes aggregation for lighter payload
    byStationCode = new Map<string, number[]>();
    medianUsages.forEach(stats => {
        let hour = parseInt(stats.timeslot.split(':')[0], 10);
        let minute = parseInt(stats.timeslot.split(':')[1], 10);
        let index = 2*hour+Math.floor(minute/30);

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
