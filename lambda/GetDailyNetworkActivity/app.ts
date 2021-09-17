import "reflect-metadata";
import { classToPlain, } from 'class-transformer';
import { getNetworkDailyUsageStats } from "../common/repository/dailynetworkUsageStatsRepository";

export const lambdaHandler = async () => {
    let networkDailyyUsage = await getNetworkDailyUsageStats(new Date());
    return {
        statusCode: 200,
        headers:{
            "Access-Control-Allow-Origin": 'https://www.velinfo.fr',
        },
        body: JSON.stringify(classToPlain(networkDailyyUsage)),
        isBase64Encoded: false
    };
}