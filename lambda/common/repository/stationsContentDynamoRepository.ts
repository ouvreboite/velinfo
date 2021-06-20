
import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import {StationsContent} from "../domain";
import {classToDynamo, dynamoToClass} from "../dynamoTransformer";
export {updateStationsContent, getStationsContent};

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();

async function updateStationsContent(stationsContent: StationsContent) {
    let dynamoObject = classToDynamo(stationsContent);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: 'CurrentStationsContent',
        Key: {
            "id": 'CurrentStationsContent'
        },
        UpdateExpression: "set byStationCode = :byStationCode , fetchDateTime = :fetchDateTime",
        ExpressionAttributeValues: {
            ":byStationCode": dynamoObject.byStationCode,
            ":fetchDateTime": dynamoObject.fetchDateTime
        }
    };

    await client.update(request).promise();
    console.log("updateStationsContent");
}

async function getStationsContent(): Promise<StationsContent> {
    let request: AWS.DynamoDB.DocumentClient.GetItemInput = {
        TableName: 'CurrentStationsContent',
        Key: {
            id: 'CurrentStationsContent'
        }
    };

    let data = await client.get(request).promise()
    return dynamoToClass(StationsContent, data.Item);
}