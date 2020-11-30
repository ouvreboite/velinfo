import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import {StationsExpectedActivities} from "../domain";
import {classToDynamo, dynamoToClass} from "../dynamoTransformer";
export {updateExpectedColdActivities, getExpectedColdActivities};

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();
const expectedActivitiesTableName: string = process.env.EXPECTED_COLD_ACTIVITY_TABLE_NAME;

async function updateExpectedColdActivities(expectedActivities: StationsExpectedActivities) {
    let dynamoObject = classToDynamo(expectedActivities);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: expectedActivitiesTableName,
        Key: {
            "id": 'currentExpectedActivity'
        },
        UpdateExpression: "set byStationCode = :byStationCode , fetchDateTime = :fetchDateTime",
        ExpressionAttributeValues: {
            ":byStationCode": dynamoObject.byStationCode,
            ":fetchDateTime": dynamoObject.fetchDateTime
        }
    };

    await client.update(request).promise();
    console.log("Update ok");
}

async function getExpectedColdActivities(): Promise<StationsExpectedActivities> {
    let request: AWS.DynamoDB.DocumentClient.GetItemInput = {
        TableName: expectedActivitiesTableName,
        Key: {
            id: 'currentExpectedActivity'
        }
    };

    let data = await client.get(request).promise();
    return dynamoToClass(StationsExpectedActivities, data.Item);
}