import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import { toParisTZ } from '../dateUtil';
import {StationsExpectedActivities2} from "../domain";
import {classToDynamo, dynamoToClass} from "../dynamoTransformer";
export {updateExpectedActivities, getExpectedActivities};

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();
const expectedActivitiesTableName: string = process.env.EXPECTED_ACTIVITY_TABLE_NAME;

async function updateExpectedActivities(expectedActivities: StationsExpectedActivities2) {
    let dynamoObject = classToDynamo(expectedActivities);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: expectedActivitiesTableName,
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

async function getExpectedActivities(date: Date): Promise<StationsExpectedActivities2> {
    let weekday = toParisTZ(date).getDay();
    let hour = toParisTZ(date).getHours();
    let request: AWS.DynamoDB.DocumentClient.GetItemInput = {
        TableName: expectedActivitiesTableName,
        Key: {
            weekday: weekday,
            hour: hour
        }
    };

    let data = await client.get(request).promise();
    return dynamoToClass(StationsExpectedActivities2, data.Item);
}