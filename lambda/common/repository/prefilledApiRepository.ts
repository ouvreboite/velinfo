import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import { CurrentStations, GlobalStatistics } from '../api';
import { classToDynamo, dynamoToClass } from '../dynamoTransformer';
export {updateCurrentStations, getCurrentStations, updateGlobalStatistics, getGlobalStatistics};

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();
const prefilledApiTableName: string = process.env.PREFILLED_API_TABLE_NAME;

async function updateCurrentStations(stations: CurrentStations) {
    let dynamoObject = classToDynamo(stations);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: prefilledApiTableName,
        Key: {
            "id": 'currentStations'
        },
        UpdateExpression: "set payload = :payload",
        ExpressionAttributeValues: {
            ":payload": dynamoObject
        }
    };

    await client.update(request).promise();
    console.log("updateCurrentStations");
}

async function getCurrentStations(): Promise<CurrentStations> {
    let request: AWS.DynamoDB.DocumentClient.GetItemInput = {
        TableName: prefilledApiTableName,
        Key: {
            id: 'currentStations'
        }
    };

    let data = await client.get(request).promise();
    return dynamoToClass(CurrentStations, data.Item.payload);
}

async function updateGlobalStatistics(globalStatistics: GlobalStatistics) {
    let dynamoObject = classToDynamo(globalStatistics);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: prefilledApiTableName,
        Key: {
            "id": 'globalStatistics'
        },
        UpdateExpression: "set payload = :payload",
        ExpressionAttributeValues: {
            ":payload": dynamoObject
        }
    };

    await client.update(request).promise();
    console.log("updateGlobalStatistics");
}

async function getGlobalStatistics(): Promise<GlobalStatistics> {
    let request: AWS.DynamoDB.DocumentClient.GetItemInput = {
        TableName: prefilledApiTableName,
        Key: {
            id: 'globalStatistics'
        }
    };

    let data = await client.get(request).promise();
    return dynamoToClass(GlobalStatistics, data.Item.payload);
}
