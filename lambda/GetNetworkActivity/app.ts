import "reflect-metadata";

import { APIGatewayProxyEvent } from 'aws-lambda';
import { classToPlain } from 'class-transformer';

import { getNetworkDailyUsageStats } from "../common/repository/dailynetworkUsageStatsRepository";

export const lambdaHandler = async (event: APIGatewayProxyEvent) => {
    let networkDailyyUsage = await getNetworkDailyUsageStats(new Date());
    return {
        statusCode: 200,
        body: JSON.stringify(classToPlain(networkDailyyUsage)),
        isBase64Encoded: false
    };
}