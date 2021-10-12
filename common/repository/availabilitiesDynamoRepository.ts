
import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import {StationsFetchedAvailabilities} from "../domain";
import {classToDynamo, dynamoToClass} from "../dynamoTransformer";
export {updateAvailabilities, getAvailabilities};

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();
const availabilityTableName: string = process.env.AVAILABILITY_TABLE_NAME;

async function updateAvailabilities(fetchedAvailabilities: StationsFetchedAvailabilities) {
    let dynamoObject = classToDynamo(fetchedAvailabilities);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: availabilityTableName,
        Key: {
            "id": 'currentAvailability'
        },
        UpdateExpression: "set byStationCode = :byStationCode , fetchDateTime = :fetchDateTime, mostRecentOfficialDueDateTime = :mostRecentOfficialDueDateTime",
        ExpressionAttributeValues: {
            ":byStationCode": dynamoObject.byStationCode,
            ":fetchDateTime": dynamoObject.fetchDateTime,
            ":mostRecentOfficialDueDateTime": dynamoObject.mostRecentOfficialDueDateTime
        }
    };

    await client.update(request).promise();
    console.log("Update ok");
}

async function getAvailabilities(): Promise<StationsFetchedAvailabilities> {
    let request: AWS.DynamoDB.DocumentClient.GetItemInput = {
        TableName: availabilityTableName,
        Key: {
            id: 'currentAvailability'
        }
    };

    let data = await client.get(request).promise()
    return dynamoToClass(StationsFetchedAvailabilities, data.Item);
}