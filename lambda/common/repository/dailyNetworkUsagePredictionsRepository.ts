import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';

import { inXDays, toParisTZ, toUnixTimestamp } from "../dateUtil";
import { NetworkDailyUsagePredictions } from '../domain/station-usage';
import { classToDynamo, dynamoToClass } from "../dynamoTransformer";

export {getNetworkDailyUsagePredictions, updateNetworkDailyUsagePredictions}

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();
const ttlDays = 60;

async function getNetworkDailyUsagePredictions(datetime: Date): Promise<NetworkDailyUsagePredictions> {
    let weekday = toParisTZ(datetime).getDay();
    let request: AWS.DynamoDB.DocumentClient.GetItemInput ={
        TableName: 'DailyNetworkUsagePredictions',
        Key: {
            weekday: weekday,
        }
    };

    let data = await client.get(request).promise();
    return dynamoToClass(NetworkDailyUsagePredictions, data.Item);
}

async function updateNetworkDailyUsagePredictions(predictions: NetworkDailyUsagePredictions, datetime: Date) {
    let timetolive = inXDays(ttlDays);
    let weekday = toParisTZ(datetime).getDay();
    let dynamoObject = classToDynamo(predictions);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: 'DailyNetworkUsagePredictions',
        Key: {
            weekday: weekday,
        },
        UpdateExpression: "set byTimeSlot = :byTimeSlot, totalActivity = :totalActivity, timetolive = :timetolive",
        ExpressionAttributeValues: {
            ":byTimeSlot": dynamoObject.byTimeSlot,
            ":totalActivity": dynamoObject.totalActivity,
            ":timetolive": toUnixTimestamp(timetolive)
        }
    };

    await client.update(request).promise();
    console.log("updateNetworkDailyUsagePredictions");
}