import "reflect-metadata";
import { classToPlain, } from 'class-transformer';
import { getNetworkDailyUsagePredictions } from "../common/repository/dailyNetworkUsagePredictionsRepository";

export const lambdaHandler = async () => {
    let networkDailyPredictions = await getNetworkDailyUsagePredictions(new Date());
    return {
        statusCode: 200,
        headers:{
            "Access-Control-Allow-Origin": 'https://www.velinfo.fr',
        },
        body: JSON.stringify(classToPlain(networkDailyPredictions)),
        isBase64Encoded: false
    };
}