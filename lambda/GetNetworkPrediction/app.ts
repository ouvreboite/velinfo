import "reflect-metadata";

import { APIGatewayProxyEvent } from 'aws-lambda';
import { classToPlain } from 'class-transformer';

import { buildHeaders } from "../common/corsHeadersUtil";
import { getNetworkDailyUsagePredictions } from "../common/repository/dailyNetworkUsagePredictionsRepository";

export const lambdaHandler = async (event: APIGatewayProxyEvent) => {
    let networkDailyPredictions = await getNetworkDailyUsagePredictions(new Date());
    return {
        statusCode: 200,
        headers: buildHeaders(event.headers),
        body: JSON.stringify(classToPlain(networkDailyPredictions)),
        isBase64Encoded: false
    };
}