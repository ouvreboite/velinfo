import "reflect-metadata";
import { GlobalStatistic, GlobalStatistics} from "../common/api";
import { GlobalDailyStatistics } from "../common/domain";
import { getGlobalDailyStats } from "../common/repository/globalDailyStatsDynamoRepository";
import { updateGlobalStatistics } from "../common/repository/prefilledApiRepository";

export const lambdaHandler = async () => {
    let todayStatistics = await getGlobalDailyStats(new Date());
    console.log("Data fetched");
    
    let globalStatistics = new GlobalStatistics();
    globalStatistics.statistics = mapToStatArray(todayStatistics);
    globalStatistics.todaysActivity = todayStatistics.totalActivity;

    await updateGlobalStatistics(globalStatistics);
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