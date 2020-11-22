import {DynamoDB} from "aws-sdk";
import {stripToHour} from "../dateUtil";
import {StationsHourlyStatistics} from "../domain";
import {classToDynamo, dynamoToClass} from "../dynamoTransformer";
export {updateHourlyStats, getHourlyStats};

const client = new DynamoDB.DocumentClient();
const statisticsTableName = process.env.STATISTICS_TABLE_NAME;
const ttlDays = 60;

async function updateHourlyStats(hourlyStats: StationsHourlyStatistics) {
    let timetolive = new Date(hourlyStats.statsDateTime.getTime() + ttlDays * 24 * 60 * 60 * 1000);
    let dynamoObject = classToDynamo(hourlyStats);
    let request: DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: statisticsTableName,
        Key: {
            stats_day: dynamoObject.statsDay,
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
    console.log("Update ok");
}

async function getHourlyStats(statsTime: Date): Promise<StationsHourlyStatistics> {
    statsTime = stripToHour(statsTime);

    let statsDay = statsTime.toISOString().substring(0, 10);
    let statsDatetime = statsTime.toISOString();

    let request: DynamoDB.DocumentClient.GetItemInput ={
        TableName: statisticsTableName,
        Key: {
            stats_day: statsDay,
            stats_datetime: statsDatetime
        }
    };

    let data = await client.get(request).promise();
    return dynamoToClass(StationsHourlyStatistics, data.Item);
}