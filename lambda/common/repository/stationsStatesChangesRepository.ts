import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import {StationStateChange} from "../domain";
import {classToDynamo,} from "../dynamoTransformer";
export {saveStationStateChange};

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();
const stationStateChangesTableTableName: string = process.env.STATE_CHANGES_TABLE_NAME;
const ttlDays = 60;

async function saveStationStateChange(change: StationStateChange) {
    let dynamoObject = classToDynamo(change);
    let timetolive = new Date(change.datetime.getTime() + ttlDays * 24 * 60 * 60 * 1000);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: stationStateChangesTableTableName,
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