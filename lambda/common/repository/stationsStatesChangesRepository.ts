import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import { inXDays, toParisDay } from '../dateUtil';
import { StationStateChange } from '../domain/station-state';
import {classToDynamo, dynamoToClass,} from "../dynamoTransformer";
export {saveStationStateChange, getStationStateChangesForDay};

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();
const ttlDays = 60;

async function saveStationStateChange(change: StationStateChange) {
    let dynamoObject = classToDynamo(change);
    let timetolive = inXDays(ttlDays);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: 'StationStateChanges',
        Key: {
            "day": change.day,
            "datetime": change.datetime.toISOString(),
        },
        UpdateExpression: "set stationCode = :stationCode, oldState = :oldState, newState = :newState, timetolive = :timetolive",
        ExpressionAttributeValues: {
            ":stationCode": dynamoObject.stationCode,
            ":oldState": dynamoObject.oldState,
            ":newState": dynamoObject.newState,
            ":timetolive": timetolive.getTime()
        }
    };

    await client.update(request).promise();
    console.log("saveStationStateChange");
}

async function getStationStateChangesForDay(date: Date): Promise<StationStateChange[]> {
    let day = toParisDay(date);
    let request: AWS.DynamoDB.DocumentClient.QueryInput = {
        TableName: 'StationStateChanges',
        ScanIndexForward: false,
        KeyConditionExpression: '#day = :day',
        ExpressionAttributeNames: { "#day": "day" },
        ExpressionAttributeValues: {
            ":day": day
        }
    };

    let data = await client.query(request).promise();
    return data.Items.map(item => dynamoToClass(StationStateChange, item));
}