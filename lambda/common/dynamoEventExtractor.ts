import {DynamoDB} from "aws-sdk";
import {DynamoDBStreamEvent} from "aws-lambda";
import {StationsFetchedAvailabilities} from "./domain";
import {dynamoToClass} from "./dynamoTransformer";

export function extractStationsFetchedAvailabilities(event: DynamoDBStreamEvent): StationsFetchedAvailabilities {
    if (event.Records == undefined || event.Records.length == 0) {
        throw new Error('No record defined');
    }

    if (event.Records.length > 1) {
        throw new Error('More than one record (' + event.Records.length + ')');
    }

    let newImage = event.Records[0].dynamodb.NewImage;
    let unmarschalled = DynamoDB.Converter.unmarshall(newImage);
    return dynamoToClass(StationsFetchedAvailabilities, unmarschalled);
}