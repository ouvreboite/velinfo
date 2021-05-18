import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import { buildTimeSlot, toParisTZ } from '../dateUtil';
import {StationMedianUsage, StationsExpectedActivities} from "../domain";
import {classToDynamo, dynamoToClass} from "../dynamoTransformer";
export {updateMedianUsage, getMedianUsage, getMedianUsagesForDay};

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();

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
    let request: AWS.DynamoDB.DocumentClient.GetItemInput = {
        TableName: 'MedianUsage',
        Key: {
            weekday: weekday,
            timeslot: timeslot
        }
    };

    let data = await client.get(request).promise();
    return dynamoToClass(StationMedianUsage, data.Item);
}

async function getMedianUsagesForDay(date: Date): Promise<StationMedianUsage[]> {
    let weekday = toParisTZ(date).getDay();
    let request: AWS.DynamoDB.DocumentClient.QueryInput = {
        TableName: 'MedianUsage',
        KeyConditionExpression: 'weekday = :weekday',
        ExpressionAttributeValues: {
            ":weekday": weekday
        }
    };

    let data = await client.query(request).promise();
    return data.Items.map(item =>  dynamoToClass(StationMedianUsage, item));
}