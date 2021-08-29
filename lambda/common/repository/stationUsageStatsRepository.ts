import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import {buildTimeSlot, inXDays, toParisDay} from "../dateUtil";
import { StationsUsageStatistics } from '../domain/statistic';
import {classToDynamo, dynamoToClass} from "../dynamoTransformer";
export {updateStationUsageStats, getStationUsageStats, getStationUsageStatsForDay};

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();
const ttlDays = 60;
const hours = ["00","01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16","17","18","19","20","21","22","23"];

async function updateStationUsageStats(stats: StationsUsageStatistics, datetime: Date) {
    let timetolive = inXDays(ttlDays);
    let day = toParisDay(datetime);
    let timeslot = buildTimeSlot(datetime);
    let dynamoObject = classToDynamo(stats);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: 'StationUsageStatistics',
        Key: {
            day: day,
            timeslot: timeslot
        },
        UpdateExpression: "set byStationCode = :byStationCode, totalActivity = :totalActivity, timetolive = :timetolive",
        ExpressionAttributeValues: {
            ":byStationCode": dynamoObject.byStationCode,
            ":totalActivity": dynamoObject.totalActivity,
            ":timetolive": timetolive.getTime()
        }
    };

    await client.update(request).promise();
    
    console.log("updateUsageStats");
}

async function getStationUsageStats(datetime: Date): Promise<StationsUsageStatistics> {
    let day = toParisDay(datetime);
    let timeslot = buildTimeSlot(datetime);
    console.log("getStationUsageStats for : "+day+", "+timeslot);

    let request: AWS.DynamoDB.DocumentClient.GetItemInput ={
        TableName: 'StationUsageStatistics',
        Key: {
            day: day,
            timeslot: timeslot
        }
    };

    let data = await client.get(request).promise();
    let usage = dynamoToClass(StationsUsageStatistics, data.Item);
    console.log("getStationUsageStats for : "+day+", "+timeslot+" = "+usage?.byStationCode?.size);
    return usage;
}

async function getStationUsageStatsForDay(date: Date): Promise<StationsUsageStatistics[]> {
    const day = toParisDay(date);
    let queries = hours.map((hour)=> getStationUsageStatsForDayAndHour(day, hour));
    let allUsagesForDay = await Promise.all(queries);
    return allUsagesForDay.flat();
}

async function getStationUsageStatsForDayAndHour(day: string, hour: string): Promise<StationsUsageStatistics[]> {
    let request: AWS.DynamoDB.DocumentClient.QueryInput = {
        TableName: 'StationUsageStatistics',
        KeyConditionExpression: '#day = :day and begins_with(timeslot, :hour)',
        ExpressionAttributeValues: {
            ":day": day,
            ":hour":hour
        },
        ExpressionAttributeNames: {
            "#day": "day"
          }
    };

    let data = await client.query(request).promise();
    return data.Items.map(item => dynamoToClass(StationsUsageStatistics, item));
}