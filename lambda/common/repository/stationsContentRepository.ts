
import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import { inXDays, toUnixTimestamp } from '../dateUtil';
import { StationsContent } from '../domain/station-content';
import { classToDynamo, dynamoToClass } from "../dynamoTransformer";
export { updateStationsContent, getLastStationsContent };

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();
const ttlDays = 1;

async function updateStationsContent(stationsContent: StationsContent) {
    let timetolive = inXDays(ttlDays);
    let dynamoObject = classToDynamo(stationsContent);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: 'StationsContent',
        Key: {
            "id": 'stationsContent',
            "dateTime":dynamoObject.dateTime
        },
        UpdateExpression: "set byStationCode = :byStationCode, timetolive = :timetolive",
        ExpressionAttributeValues: {
            ":byStationCode": dynamoObject.byStationCode,
            ":timetolive": toUnixTimestamp(timetolive)
        }
    };

    await client.update(request).promise();
    console.log("updateStationsContent");
}

async function getLastStationsContent(): Promise<StationsContent> {
    let request: AWS.DynamoDB.DocumentClient.QueryInput = {
        TableName: 'StationsContent',
        ScanIndexForward: false,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
            ":id": 'stationsContent'
        },
        Limit: 1
    };

    let data = await client.query(request).promise()
    let contents = data.Items.map(item => dynamoToClass(StationsContent, item));
    return contents.length>0?contents[0]:undefined;
}