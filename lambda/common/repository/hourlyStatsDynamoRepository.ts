import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import {stripToHour, toParisDay, toParisTZ} from "../dateUtil";
import {StationsHourlyStatistics} from "../domain";
import {classToDynamo, dynamoToClass} from "../dynamoTransformer";
export {updateStationHourlyStats, getStationHourlyStats, getStationHourlyStatsForDay};

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();
const stationHourlyStatisticsTableName = process.env.STATION_HOURLY_STATISTICS_TABLE_NAME;
const ttlDays = 60;

async function updateStationHourlyStats(hourlyStats: StationsHourlyStatistics) {
    let timetolive = new Date(hourlyStats.statsDateTime.getTime() + ttlDays * 24 * 60 * 60 * 1000);
    let statsDay = toParisDay(hourlyStats.statsDateTime);
    let dynamoObject = classToDynamo(hourlyStats);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: stationHourlyStatisticsTableName,
        Key: {
            stats_day: statsDay,
            stats_datetime: dynamoObject.statsDateTime
        },
        UpdateExpression: "set byStationCode = :byStationCode, totalActivity = :totalActivity, lastFetchDateTime = :lastFetchDateTime, timetolive = :timetolive",
        ExpressionAttributeValues: {
            ":byStationCode": dynamoObject.byStationCode,
            ":totalActivity": dynamoObject.totalActivity,
            ":lastFetchDateTime":dynamoObject.lastFetchDateTime,
            ":timetolive": timetolive.getTime()
        }
    };

    await client.update(request).promise();
    
    console.log("updateStationHourlyStats");
}

async function getStationHourlyStats(statsTime: Date): Promise<StationsHourlyStatistics> {
    statsTime = stripToHour(statsTime);

    let statsDay = toParisDay(statsTime);
    let statsDatetime = statsTime.toISOString();

    let request: AWS.DynamoDB.DocumentClient.GetItemInput ={
        TableName: stationHourlyStatisticsTableName,
        Key: {
            stats_day: statsDay,
            stats_datetime: statsDatetime
        }
    };

    let data = await client.get(request).promise();
    return dynamoToClass(StationsHourlyStatistics, data.Item);
}

async function getStationHourlyStatsForDay(date: Date): Promise<StationsHourlyStatistics[]> {
    let day = toParisTZ(date).toISOString();
    let request: AWS.DynamoDB.DocumentClient.QueryInput = {
        TableName: stationHourlyStatisticsTableName,
        KeyConditionExpression: 'stats_day = :stats_day',
        ExpressionAttributeValues: {
            ":stats_day": day
        }
    };

    let data = await client.query(request).promise();
    return data.Items.map(item =>  dynamoToClass(StationsHourlyStatistics, item));
}