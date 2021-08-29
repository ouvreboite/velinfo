import "reflect-metadata";
import { GlobalStatistic, GlobalStatistics } from "../common/api";
import { GlobalDailyStatistics } from "../common/domain/statistic";
import { getGlobalDailyStats } from "../common/repository/globalDailyStatsRepository";

export const lambdaHandler = async () => {
    let todayStatistics = await getGlobalDailyStats(new Date());
    
    let globalStatistics = new GlobalStatistics();
    globalStatistics.statistics = mapToStatArray(todayStatistics);
    globalStatistics.todaysActivity = todayStatistics.totalActivity;

    return {
        statusCode: 200,
        headers:{
            "Access-Control-Allow-Origin": 'https://www.velinfo.fr',
        },
        body: JSON.stringify(globalStatistics),
        isBase64Encoded: false
    };
}

function mapToStatArray(globalDailyStatistics: GlobalDailyStatistics): GlobalStatistic[]{
    let statArray : GlobalStatistic[] = [];
    if(globalDailyStatistics){
        globalDailyStatistics.byHour.forEach((stat, hour)=>{
            let globalStat = new GlobalStatistic();
            globalStat.day=globalDailyStatistics.stats_day;
            globalStat.hour=parseInt(hour);
            globalStat.activity=stat.activity;
            statArray.push(globalStat);
        });
    }
    return statArray;
}