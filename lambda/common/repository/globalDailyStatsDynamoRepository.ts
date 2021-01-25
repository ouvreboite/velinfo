import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import {toParisDay} from "../dateUtil";
import {GlobalDailyStatistics} from "../domain";
import {classToDynamo, dynamoToClass} from "../dynamoTransformer";
export {updateGlobalDailyStats, getGlobalDailyStats};

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();
const globalDailyStatisticsTableName = process.env.GLOBAL_DAILY_STATISTICS_TABLE_NAME;
const ttlDays = 60;

async function updateGlobalDailyStats(globalDailyStatistics: GlobalDailyStatistics) {
    let timetolive = new Date(new Date().getTime() + ttlDays * 24 * 60 * 60 * 1000);
    let dynamoObject = classToDynamo(globalDailyStatistics);
    let statsDay = toParisDay(globalDailyStatistics.firstFetchDateTime);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: globalDailyStatisticsTableName,
        Key: {
            stats_day: statsDay
        },
        UpdateExpression: "set firstFetchDateTime = :firstFetchDateTime, byHour = :byHour, totalActivity = :totalActivity, timetolive = :timetolive",
        ExpressionAttributeValues: {
            ":firstFetchDateTime": dynamoObject.firstFetchDateTime,
            ":byHour": dynamoObject.byHour,
            ":totalActivity": dynamoObject.totalActivity,
            ":timetolive": timetolive.getTime()
        }
    };

    await client.update(request).promise();
    console.log("Update ok");
}

async function getGlobalDailyStats(statsTime: Date): Promise<GlobalDailyStatistics> {
    let statsDay = toParisDay(statsTime);

    let request: AWS.DynamoDB.DocumentClient.GetItemInput ={
        TableName: globalDailyStatisticsTableName,
        Key: {
            stats_day: statsDay
        }
    };

    let data = await client.get(request).promise();
    return dynamoToClass(GlobalDailyStatistics, data.Item);
}