
import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import { StationsCharacteristics } from '../domain/station-characteristics';
import { classToDynamo, dynamoToClass } from "../dynamoTransformer";
export { updateStationsCharacteristics, getLastStationsCharacteristics };

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();
const ttlDays = 1;

async function updateStationsCharacteristics(stationsCharacteristics: StationsCharacteristics) {
    let timetolive = new Date(stationsCharacteristics.dateTime.getTime() + ttlDays * 24 * 60 * 60 * 1000);
    let dynamoObject = classToDynamo(stationsCharacteristics);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: 'StationsCharacteristics',
        Key: {
            "id": 'stationsCharacteristics',
            "dateTime":dynamoObject.dateTime
        },
        UpdateExpression: "set byStationCode = :byStationCode, timetolive = :timetolive",
        ExpressionAttributeValues: {
            ":byStationCode": dynamoObject.byStationCode,
            ":timetolive": timetolive.getTime()
        }
    };

    await client.update(request).promise();
    console.log("updateStationsCharacteristics");
}

async function getLastStationsCharacteristics(): Promise<StationsCharacteristics> {
    let request: AWS.DynamoDB.DocumentClient.QueryInput = {
        TableName: 'StationsCharacteristics',
        ScanIndexForward: false,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
            ":id": 'stationsCharacteristics'
        },
        Limit: 1
    };

    let data = await client.query(request).promise()
    let contents = data.Items.map(item => dynamoToClass(StationsCharacteristics, item));
    return contents.length>0?contents[0]:undefined;
}