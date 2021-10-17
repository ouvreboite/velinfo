import { APIGatewayProxyEventHeaders } from "aws-lambda";

export function buildHeaders(requestHeaders : APIGatewayProxyEventHeaders){
    return {
        'Access-Control-Allow-Origin': 'https://www.velinfo.fr',
    }
}