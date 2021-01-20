import "reflect-metadata";
import { GlobalStatistic, GlobalStatistics, Station } from "../../common/api";
import { GlobalDailyStatistics } from "../../common/domain";
import { getGlobalDailyStats } from "../../common/repository/globalDailyStatsDynamoRepository";

const cacheTTLseconds = 30;
var cachedTimestamp : Date;
var cachedGlobalStatistics : GlobalStatistics;

export const lambdaHandler = async () => {
    if(cacheHot()){
        return cachedGlobalStatistics;
    }

    let today = new Date();

    let todayStatistics = await getGlobalDailyStats(today);

    let globalStatistics = new GlobalStatistics();
    globalStatistics.statistics = mapToStatArray(todayStatistics);
    globalStatistics.todaysActivity = todayStatistics.totalActivity;

    updateCache(globalStatistics)
    
    return globalStatistics;
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

function cacheHot(){
    if(!cachedTimestamp)
        return false;
    
    var difSeconds = (new Date().getTime() - cachedTimestamp.getTime())/ 1000;
    return difSeconds < cacheTTLseconds;
}

function updateCache(globalStatistics : GlobalStatistics){
    cachedTimestamp = new Date();

    cachedGlobalStatistics = globalStatistics;
    globalStatistics["cachedTimestamp"] = cachedTimestamp;
}