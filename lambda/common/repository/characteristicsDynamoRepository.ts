
import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import {StationsFetchedCharacteristics} from "../domain";
import {classToDynamo, dynamoToClass} from "../dynamoTransformer";
export {updateCharacteristics, getCharacteristics};

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();
const characteristicsTableName: string = process.env.CHARACTERISTICS_TABLE_NAME;

async function updateCharacteristics(fetchedCharacteristics: StationsFetchedCharacteristics) {
    let dynamoObject = classToDynamo(fetchedCharacteristics);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: characteristicsTableName,
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
    console.log("Update ok");
}

async function getCharacteristics(): Promise<StationsFetchedCharacteristics> {
    let request: AWS.DynamoDB.DocumentClient.GetItemInput = {
        TableName: characteristicsTableName,
        Key: {
            id: 'currentCharacteristics'
        }
    };

    let data = await client.get(request).promise()
    return dynamoToClass(StationsFetchedCharacteristics, data.Item);
}