import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import {StationsStates} from "../domain";
import {classToDynamo, dynamoToClass} from "../dynamoTransformer";
export {updateStationsStates, getStationsStates};

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();
const stationStatesTableName: string = process.env.STATES_TABLE_NAME;

async function updateStationsStates(stationsStates: StationsStates) {
    let dynamoObject = classToDynamo(stationsStates);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: stationStatesTableName,
        Key: {
            "id": 'stationStates'
        },
        UpdateExpression: "set byStationCode = :byStationCode , fetchDateTime = :fetchDateTime",
        ExpressionAttributeValues: {
            ":byStationCode": dynamoObject.byStationCode,
            ":fetchDateTime": dynamoObject.fetchDateTime
        }
    };

    await client.update(request).promise();
    console.log("updateStationsStates");
}

async function getStationsStates(): Promise<StationsStates> {
    let request: AWS.DynamoDB.DocumentClient.GetItemInput = {
        TableName: stationStatesTableName,
        Key: {
            id: 'stationStates'
        }
    };

    let data = await client.get(request).promise();
    return dynamoToClass(StationsStates, data.Item);
}