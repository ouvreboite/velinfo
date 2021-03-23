import {DynamoDB} from "aws-sdk";
import {DynamoDBStreamEvent} from "aws-lambda";
import {dynamoToClass} from "./dynamoTransformer";
import { ClassType } from "class-transformer/ClassTransformer";

export function extractDynamoEvent<T>(cls: ClassType<T>, event: DynamoDBStreamEvent): T {
    if (event.Records == undefined || event.Records.length == 0) {
        throw new Error('No record defined');
    }

    if (event.Records.length > 1) {
        throw new Error('More than one record (' + event.Records.length + ')');
    }

    let newImage = event.Records[0].dynamodb.NewImage;
    let unmarschalled = DynamoDB.Converter.unmarshall(newImage);
    return dynamoToClass(cls, unmarschalled);
}