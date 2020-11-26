import {DynamoDB} from "aws-sdk";
import {StationsStates} from "../domain";
import {classToDynamo, dynamoToClass} from "../dynamoTransformer";
export {updateStationsStates, getStationsStates};

const client: DynamoDB.DocumentClient = new DynamoDB.DocumentClient();
const stationStatesTableName: string = process.env.STATES_TABLE_NAME;

async function updateStationsStates(stationsStates: StationsStates) {
    let dynamoObject = classToDynamo(stationsStates);
    let request: DynamoDB.DocumentClient.UpdateItemInput = {
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
    console.log("Update ok");
}

async function getStationsStates(): Promise<StationsStates> {
    let request: DynamoDB.DocumentClient.GetItemInput = {
        TableName: stationStatesTableName,
        Key: {
            id: 'stationStates'
        }
    };

    let data = await client.get(request).promise();
    return dynamoToClass(StationsStates, data.Item);
}