import "reflect-metadata";

import { APIGatewayProxyEvent } from 'aws-lambda';
import { classToPlain } from 'class-transformer';

import { buildHeaders } from "../common/corsHeadersUtil";
import { getNetworkDailyUsageStats } from "../common/repository/dailynetworkUsageStatsRepository";

export const lambdaHandler = async (event: APIGatewayProxyEvent) => {
    let networkDailyyUsage = await getNetworkDailyUsageStats(new Date());
    return {
        statusCode: 200,
        headers: buildHeaders(event.headers),
        body: JSON.stringify(classToPlain(networkDailyyUsage)),
        isBase64Encoded: false
    };
}