import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import {inXDays, toParisDay, toUnixTimestamp} from "../dateUtil";
import { NetworkDailyUsageStatistics } from '../domain/statistic';
import {classToDynamo, dynamoToClass} from "../dynamoTransformer";
export {getNetworkDailyUsageStats, updateNetworkDailyUsageStats}

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();
const ttlDays = 60;

async function getNetworkDailyUsageStats(datetime: Date): Promise<NetworkDailyUsageStatistics> {
    let statsDay = toParisDay(datetime);

    let request: AWS.DynamoDB.DocumentClient.GetItemInput ={
        TableName: 'DailyNetworkUsageStatistics',
        Key: {
            day: statsDay
        }
    };

    let data = await client.get(request).promise();
    return dynamoToClass(NetworkDailyUsageStatistics, data.Item);
}

async function updateNetworkDailyUsageStats(stats: NetworkDailyUsageStatistics, datetime: Date) {
    let timetolive = inXDays(ttlDays);
    let day = toParisDay(datetime);
    let dynamoObject = classToDynamo(stats);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: 'DailyNetworkUsageStatistics',
        Key: {
            day: day
        },
        UpdateExpression: "set byTimeSlot = :byTimeSlot, totalActivity = :totalActivity, timetolive = :timetolive",
        ExpressionAttributeValues: {
            ":byTimeSlot": dynamoObject.byTimeSlot,
            ":totalActivity": dynamoObject.totalActivity,
            ":timetolive": toUnixTimestamp(timetolive)
        }
    };

    await client.update(request).promise();
    console.log("updateStationUsageStats");
}