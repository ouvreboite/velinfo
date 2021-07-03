import "reflect-metadata";
import { fetchStationsContent } from "./velibStationsStatusClient";
import { getLastStationsContent, updateStationsContent } from "../common/repository/stationsContentDynamoRepository";
import { ContentDelta } from "../common/domain/content-delta";
import { StationContent, StationsContent } from "../common/domain/station-content";

export const lambdaHandler = async (event: any) => {
    let [newStationsContent, previousStationsContent] = await Promise.all([fetchStationsContent(), getLastStationsContent()]);
    console.log("previous:"+ previousStationsContent?.dateTime);

    if(newStationsContent.byStationCode.size == 1){
        console.error("Only one station fetched, retrying");
        newStationsContent = await fetchStationsContent();
    }
    
    try{
        let deltaFilledContent = fillDelta(newStationsContent, previousStationsContent);
        await updateStationsContent(deltaFilledContent);
    }catch(e){
        console.error(e);
        console.error(newStationsContent);
        throw e;
    }
}

function fillDelta(current: StationsContent, previous: StationsContent): StationsContent {
    if (previous === undefined) {
        console.log("previous undefined");
        return current;
    }

    current.byStationCode.forEach((stationContent: StationContent, stationCode: string)=>{
        var previousStationContent = previous.byStationCode.get(stationCode);
        var delta = new ContentDelta();
        if (previousStationContent === undefined) {
            delta.electrical = 0;
            delta.mechanical = 0;
            delta.activity = 0;
        }
        else {
            var deltaElectrical = stationContent.electrical - previousStationContent.electrical;
            var deltaMechanical = stationContent.mechanical - previousStationContent.mechanical;
            var activity = Math.abs(deltaElectrical) + Math.abs(deltaMechanical);

            delta.electrical = deltaElectrical;
            delta.mechanical = deltaMechanical;
            delta.activity = activity;

            if (deltaElectrical == 0 && deltaMechanical == 0) {
                delta.inactiveSince = previousStationContent.delta?.inactiveSince || previous.dateTime;
            }
        }
        stationContent.delta = delta;
    });

    console.log("delta finished "+current.dateTime.toISOString());
    return current;
}