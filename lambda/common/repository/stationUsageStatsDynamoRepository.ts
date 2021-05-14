import * as uninstrumentedAWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import {toParisDay, toParisTZ} from "../dateUtil";
import {StationsUsageStatistics} from "../domain";
import {classToDynamo, dynamoToClass} from "../dynamoTransformer";
export {updateStationUsageStats, getStationUsageStats, getStationUsageStatsForDay};

const AWS = AWSXRay.captureAWS(uninstrumentedAWS);
const client: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();
const ttlDays = 60;

async function updateStationUsageStats(stats: StationsUsageStatistics, datetime: Date) {
    let timetolive = new Date(datetime.getTime() + ttlDays * 24 * 60 * 60 * 1000);
    let day = toParisDay(datetime);
    let timeslot = buildTimeSlot(datetime);
    let dynamoObject = classToDynamo(stats);
    let request: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: 'StationUsageStatistics',
        Key: {
            day: day,
            timeslot: timeslot
        },
        UpdateExpression: "set byStationCode = :byStationCode, totalActivity = :totalActivity, timetolive = :timetolive",
        ExpressionAttributeValues: {
            ":byStationCode": dynamoObject.byStationCode,
            ":totalActivity": dynamoObject.totalActivity,
            ":timetolive": timetolive.getTime()
        }
    };

    await client.update(request).promise();
    
    console.log("updateUsageStats");
}

async function getStationUsageStats(datetime: Date): Promise<StationsUsageStatistics> {
    let day = toParisDay(datetime);
    let timeslot = buildTimeSlot(datetime);

    let request: AWS.DynamoDB.DocumentClient.GetItemInput ={
        TableName: 'StationUsageStatistics',
        Key: {
            day: day,
            timeslot: timeslot
        }
    };

    let data = await client.get(request).promise();
    return dynamoToClass(StationsUsageStatistics, data.Item);
}

async function getStationUsageStatsForDay(date: Date): Promise<StationsUsageStatistics[]> {
    let day = toParisDay(date);
    let request: AWS.DynamoDB.DocumentClient.QueryInput = {
        TableName: 'StationUsageStatistics',
        KeyConditionExpression: 'stats_day = :stats_day',
        ExpressionAttributeValues: {
            ":stats_day": day
        }
    };

    let data = await client.query(request).promise();
    return data.Items.map(item => dynamoToClass(StationsUsageStatistics, item));
}

function buildTimeSlot(datetime: Date): string{
    let parisTz = toParisTZ(datetime);
    let minutesSlot = Math.floor(parisTz.getMinutes()/5)*5;
    let formattedMinutesSlot = minutesSlot.toLocaleString('fr-FR', {
        minimumIntegerDigits: 2,
        useGrouping: false
    });
    let formattedHoursSlot = parisTz.getHours().toLocaleString('fr-FR', {
        minimumIntegerDigits: 2,
        useGrouping: false
    });
    return formattedHoursSlot+":"+formattedMinutesSlot;
}