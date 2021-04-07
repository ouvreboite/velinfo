import "reflect-metadata";
import { DynamoDBStreamEvent } from "aws-lambda";
import { OfficialStatus, StationCharacteristics, StationsFetchedCharacteristics, StationStateChange } from "../common/domain";
import { extractDynamoEvent } from "../common/dynamoEventExtractor";
import Twit, { Params } from "twit";
import { getCharacteristics } from "../common/repository/characteristicsDynamoRepository";

const twitterConsumerKey: string = process.env.TWITTER_CONSUMER_KEY;
const twitterConsumerSecret: string = process.env.TWITTER_CONSUMER_SECRET;
const twitterAccessToken: string = process.env.TWITTER_ACCESS_TOKEN;
const twitterAccessTokenSecret: string = process.env.TWITTER_ACCESS_TOKEN_SECRET;

var stationCharacteristics: StationsFetchedCharacteristics = null;

export const lambdaHandler = async (event: DynamoDBStreamEvent) => {
    let stateChange = extractDynamoEvent(StationStateChange, event);

    //only tweet official status change for now
    if(stateChange.newState.officialStatus == stateChange.oldState.officialStatus)
        return;

    if(!stationCharacteristics){
        stationCharacteristics = await getCharacteristics();
    }

    let station = stationCharacteristics.byStationCode.get(stateChange.stationCode);
    if(!station){
        console.error("No station found for code "+stateChange.stationCode);
        return;
    }

    let message = buildMessage(stateChange, station);
    await postTweet(message);
}

function postTweet (message: string) {
    let twit = new Twit({
        consumer_key:         twitterConsumerKey,
        consumer_secret:      twitterConsumerSecret,
        access_token:         twitterAccessToken,
        access_token_secret:  twitterAccessTokenSecret,
        timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
        strictSSL:            true,     // optional - requires SSL certificates to be valid.
      });

    let content : Params = {
        status: message
    }
    
    return new Promise((resolve, reject) => {
        twit.post('statuses/update', content, function(err, data, response) {
            if (err) { 
                return reject(err);
            }else{
                return resolve({ status: 'Tweet sent' });
            }
        });
    })
   }

function buildMessage(stateChange: StationStateChange, station: StationCharacteristics): string {
    let url = "https://www.velinfo.fr/station/"+station.stationCode;
    let statusText = buildOfficialStatusChangePhrase(stateChange.newState.officialStatus, station);

    return statusText+"\nPlus d'information sur "+url+"\n#velib";
}

function buildOfficialStatusChangePhrase(newStatus : OfficialStatus, station: StationCharacteristics): string {
    switch(newStatus){
        case OfficialStatus.Ok: 
            return "🚴 Le status officiel de la station "+station.name+" vient de passer à 'En fonctionnement'.";
        case OfficialStatus.NotInstalled: 
            return "💀 Le status officiel de la station "+station.name+" vient de passer à 'Non installé'.";
        case OfficialStatus.NotRenting: 
            return "💀 Le status officiel de la station "+station.name+" vient de passer à 'Pas de location'.";
        case OfficialStatus.NotReturning: 
            return "💀 Le status officiel de la station "+station.name+" vient de passer à 'Pas de retour'.";
        case OfficialStatus.NotRentingNotReturning: 
            return "💀 Le status officiel de la station "+station.name+" vient de passer à 'Ni retour, ni location'.";
    }
}