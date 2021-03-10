import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import { toParisTZ } from '../dateUtil';
import {StationsExpectedActivities} from "../domain";
import {classToDynamo, dynamoToClass} from "../dynamoTransformer";
export {updateExpectedHourlyActivities, getExpectedHourlyActivities, getExpectedHourlyActivitiesForDay};

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();

async function updateExpectedHourlyActivities(expectedActivities: StationsExpectedActivities) {
    let dynamoObject = classToDynamo(expectedActivities);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: 'ExpectedActivity',
        Key: {
            weekday: expectedActivities.weekday,
            hour: expectedActivities.hour
        },
        UpdateExpression: "set byStationCode = :byStationCode",
        ExpressionAttributeValues: {
            ":byStationCode": dynamoObject.byStationCode
        }
    };

    await client.update(request).promise();
    console.log("updateExpectedActivities");
}

async function getExpectedHourlyActivities(date: Date): Promise<StationsExpectedActivities> {
    let weekday = toParisTZ(date).getDay();
    let hour = toParisTZ(date).getHours();
    let request: AWS.DynamoDB.DocumentClient.GetItemInput = {
        TableName: 'ExpectedActivity',
        Key: {
            weekday: weekday,
            hour: hour
        }
    };

    let data = await client.get(request).promise();
    return dynamoToClass(StationsExpectedActivities, data.Item);
}

async function getExpectedHourlyActivitiesForDay(date: Date): Promise<StationsExpectedActivities[]> {
    let weekday = toParisTZ(date).getDay();
    let request: AWS.DynamoDB.DocumentClient.QueryInput = {
        TableName: 'ExpectedActivity',
        KeyConditionExpression: 'weekday = :weekday',
        ExpressionAttributeValues: {
            ":weekday": weekday
        }
    };

    let data = await client.query(request).promise();
    return data.Items.map(item =>  dynamoToClass(StationsExpectedActivities, item));
}