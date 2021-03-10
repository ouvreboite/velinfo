
import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import {StationsFetchedCharacteristics} from "../domain";
import {classToDynamo, dynamoToClass} from "../dynamoTransformer";
export {updateCharacteristics, getCharacteristics};

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();

async function updateCharacteristics(fetchedCharacteristics: StationsFetchedCharacteristics) {
    let dynamoObject = classToDynamo(fetchedCharacteristics);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: 'CurrentCharacteristics',
        Key: {
            "id": 'currentCharacteristics'
        },
        UpdateExpression: "set byStationCode = :byStationCode , fetchDateTime = :fetchDateTime, officialDateTime = :officialDateTime",
        ExpressionAttributeValues: {
            ":byStationCode": dynamoObject.byStationCode,
            ":fetchDateTime": dynamoObject.fetchDateTime,
            ":officialDateTime": dynamoObject.officialDateTime
        }
    };

    await client.update(request).promise();
    console.log("updateCharacteristics");
}

async function getCharacteristics(): Promise<StationsFetchedCharacteristics> {
    let request: AWS.DynamoDB.DocumentClient.GetItemInput = {
        TableName: 'CurrentCharacteristics',
        Key: {
            id: 'currentCharacteristics'
        }
    };

    let data = await client.get(request).promise()
    return dynamoToClass(StationsFetchedCharacteristics, data.Item);
}