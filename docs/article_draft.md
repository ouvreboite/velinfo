# Detecting locked Velib stations : an AWS Serverless story

Todo
~~station.coldSince => inactiveSince~~
~~FetchStationAvailabilities => FetchStationsContent ?~~
~~availability => content ? currentCapacity ?~~
~~remove the "activity" from the station table to improve perf~~
~~optmize dynamo tables capacitites~~

## Intro
Lockdown, velib station locked. I want a project to help me learn Kafka and AWS. Udacity course.

What is Velib. Paris' official bike sharing system. Since 2000??
1500 stations. Not perfect. Bikes often broken, and stations sometimes lock.
Velib expose a public API. Simple, but nice. No detail per bike, so hard to detect broken bikes. But enough detail per station to try to detect locked stations.

 I quickly create a prototype using Kafka, Kafka Stream, PostgreSQL, Java/Spring and Thymeleaf. Works quite well, but a little instable. All the infrastrcture is managed via a docker compose file and run on laptop.

(schema of proto)

Time to deploy. But how to have a Kafka cheaply ? Managed = 400€/y, self managed via EC2 ? Local raspberry pi ? Tradeoff is : costly or painful.

## Time to reassess

Time to reassess what I want to do:
- Deployed in "production" -> perpetually running
- Perpetually running -> Cheap
- On AWS
- Low maintenance -> the core pipeline must survive unattended, even with a surge in visitor
- Looks nice

What I don't want / accept not to do:
- Accurate detection (I don't even know how reliable is the data)
- Quality of code / testability. I'm here to learn about AWS
- French only
- Nothing fancy for the frontend, I'm already familiar with Angular

To choose a better (and cheaper) design, I must improve my understanding of the main AWS services. Certification.
Seems like Lambda+Dynamo may work : nice free tier, dynamo provide streaming capabilities (and Knesis since 2021), very low maintenance, easy deployment with SAM.

What's AWS Servless?
- Lambda
- Dynamodb
- Api Gateway
- SAM

Lambda allow different languages. I'll have many Lambda using shared object through dynamoDb. I want something typed. Angular will feat the bill for the frontend, and use TypeScript. Would be nice to be able to use a single language frontend and backend, but TypeScript is not directly supported by AWS Lambda (to check in 2021). But can use to aws-sam-webpack-plugin handle the conversion.

I've choosen the tech stack, time to code.

## Fetching data and optimizing dynamo db

SAM / CloudFormation / Serverless

https://dev.to/tastefulelk/serverless-framework-vs-sam-vs-aws-cdk-1g9g

Fetching is quite simple. Two endpoints. One should be polled often (1 minute), the other should change less frequently (1 hour). So I can use two lambdas, triggered by two scheduled events (that create a _Name of AWS Service_). I use Axios to ease the calling of the Velib API and store the data in two Dyname table.

Present the Velib API

How to store this data?
If I had my own SQL instance, I would probably have 2 table. For example, the stations status would be stored in a table looking like this : 
|StationCode|Datetime|ElectricBikes|MechanialBikes|EmptySlots| with an primary key/index on StationCode and DateTime.

DynamoDB support either a unique key or a key+sortkey. So I could do the same here:
|StationCode|Datetime|(stationDetailsJsonObject)|

But that would be a bad idea if I want to stay within the free tier. Dynamo pricing model rely on RCU/WCU. 1 WCU = 1 object of 1kbit per 1 second. Object size can go from 1kb (i can be smaller but still count as 1kb) to MAX_SIZE?? For example, writing a 2.5kb object (every seconds) would consume 3 WCU. 

There are 1500 velib stations. So, if I store each station as a "row", it amount to storing 1500 (small) objets per minutes. Which would needed 1500 WCU. Luckly, Dynamo support "bursting", with means that "unused" write/read operation can be accumulated for up to 5 minutes. As I'm polling every minutes, that means I'll be able to accumulate over 60 seconds, so the needed WCU would be 1500/60= 30 RCU.

That's still way to high ! The free tier allow for XX WCU and YY RCU !

Do I really to store each station individually? I could also store all the stations data in a single object (as long as it is less than 4kb in size). Talk about dynamodb size calculator and give the current size estimate.

So I only need X WCU. Much better.

|Datetime|(everyStationDetailsJsonObject)|

How long do I want to keep size data ? In fact, I don't really want to keep up. I will needed some sort of "past usage statistics" per station. But I don't need a minute-per-minute detail. So I can ahve a single entry that represent the "current" content of each stations.

|"current"|(everyStationDetailsJsonObject)|

Same goes for the "characteristics":

|"current"|(everyStationCharacteristicsJsonObject)|

(show graph of WCU comsumption)

What could be useful for later, is to not only have the current number of bikes in the station, but also the number that have been rented or returned since the last polling. Combined with the dynamoDb stream capabilities, the would mean I could almost have a stream of rented/reurned events. The API does not provide that, but I can easliy estimate it by comparing the the fetched status within the one currently in my table, and computing a simple difference : if I had 5 electic bikes in station A before, and 4 now, it means 1 has been rented (or, maybe, 2 has been rented and 1 returned within the same minute, but I have no way to know that).

So, what does it means if I see no change in the number of bikes? This station is inactive, at least for the last minute. It's way to early to considered it "locked". In fact, i could add a "inactiveSince" field and compound it : if some activity occured since the last polling, this field is reset. But if not, its content get copied over. In the end, I've got an easy way to say, for each station when did it last saw any activity.


maybe in separete part ?

Talk about why create a "fixed" window usage statistics table and not simply store any event :
storing directly the individual "events" would mean fetching the last 1h (for example) of activity would mean accessing a different amount of items, depending on the overall activity. Want to known the activity between 8AM and 9AM, it will cost you more than between 2AM and 3AM. Furhermore, a single "event" will weight way less than the 1kb minimum RCU operation. Meaning most of my RCU will be spent for nothing.

## Detecting locked stations

E(a) = delta time * median activity of station
30 minute precision, from 5 minutes subwindows
Aggregate usage in 5 minutes windows.
Compute median usage.

How to account for weather ? Daylight saving ? Lockdown ? Jour férié ?

E(a) = delta time * median activity of station * global activity ratio
Min/max the ratio

Twitter publishing
Global statistics

## API and caching

API gateway
- 2 type of gateway : simpler, other

Lambda performance : RAM attribution and X-Ray (xray with dynamodb)

Some of the dynamo table exposed and also read in the detection pipeline. Worst case, many visitor = above limit = impact the detection pipeline. Not good, not to avoid that.

Caching :
- in dynamo
- using an ElaticCache instance
- in the lambda
- in the gatewway (need complex gateway)
- in the CDN

CORS in lambda

Route53

## Frontend

(wireframe)

Angular material
Google Maps
Charts
date-fns

caching in the frontend
mobile friendly design
favorites stored in local storage

S3 bucket
CDN  (optional)

CORS for local dev

## What now ?

Cost
Alerting
Detect individual bikes locked in stations ? Contacted velib, but no result.
Could switch completely and rely on user to declare specific bikes but cumbersome. Way better if velib did it.
Let it sit for 1 year.

Example of incidents : tweet duplicate code 187 because the Velib API quickly changed and rechanged the status of one station






