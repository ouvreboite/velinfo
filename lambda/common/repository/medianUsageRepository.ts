import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import { buildTimeSlot, toParisTZ } from '../dateUtil';
import { StationMedianUsage } from '../domain/station-usage';
import {classToDynamo, dynamoToClass} from "../dynamoTransformer";
export {updateMedianUsage, getMedianUsage, getMedianUsagesForDay};

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();
const hours = ["00","01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16","17","18","19","20","21","22","23"];

async function updateMedianUsage(medianUsage: StationMedianUsage) {
    let dynamoObject = classToDynamo(medianUsage);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: 'MedianUsage',
        Key: {
            weekday: medianUsage.weekday,
            timeslot: medianUsage.timeslot
        },
        UpdateExpression: "set byStationCode = :byStationCode",
        ExpressionAttributeValues: {
            ":byStationCode": dynamoObject.byStationCode
        }
    };

    await client.update(request).promise();
    console.log("updateMedianUsage");
}

async function getMedianUsage(date: Date): Promise<StationMedianUsage> {
    let weekday = toParisTZ(date).getDay();
    let timeslot = buildTimeSlot(date);
    console.log("getMedianUsage for : "+weekday+", "+timeslot);
    let request: AWS.DynamoDB.DocumentClient.GetItemInput = {
        TableName: 'MedianUsage',
        Key: {
            weekday: weekday,
            timeslot: timeslot
        }
    };

    let data = await client.get(request).promise();
    let median = dynamoToClass(StationMedianUsage, data.Item);
    console.log("getMedianUsage for : "+weekday+", "+timeslot+" = "+median?.byStationCode?.size);
    return median;
}

async function getMedianUsagesForDay(date: Date): Promise<StationMedianUsage[]> {
    let weekday = toParisTZ(date).getDay();
    let queries = hours.map((hour)=> getMedianUsagesForWeekDayAndHour(weekday, hour));
    let allUsagesForDay = await Promise.all(queries);
    return allUsagesForDay.flat();
}

async function getMedianUsagesForWeekDayAndHour(weekday: number, hour: string): Promise<StationMedianUsage[]> {
    let request: AWS.DynamoDB.DocumentClient.QueryInput = {
        TableName: 'MedianUsage',
        KeyConditionExpression: 'weekday = :weekday and begins_with(timeslot, :hour)',
        ExpressionAttributeValues: {
            ":weekday": weekday,
            ":hour":hour
        }
    };

    let data = await client.query(request).promise();
    return data.Items.map(item => dynamoToClass(StationMedianUsage, item));
}