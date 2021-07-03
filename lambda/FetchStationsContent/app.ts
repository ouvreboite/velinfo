import "reflect-metadata";
import {fetchStationsContent} from "./velibStationsStatusClient";
import {updateStationsContent, getStationsContent} from "../common/repository/stationsContentDynamoRepository";
import {StationContent, StationsContent} from "../common/domain";

export const lambdaHandler = async (event: any) => {
    let [newStationsContent, previousStationsContent] = await Promise.all([fetchStationsContent(), getStationsContent()]);
    
    if(newStationsContent.byStationCode.size == 1){
        console.error("Only one station fetched, retrying");
        newStationsContent = await fetchStationsContent();
    }
    
    try{
        let mergedContent = mergeAndDiff(newStationsContent, previousStationsContent);
        await updateStationsContent(mergedContent);
    }catch(e){
        console.error(e);
        console.error(newStationsContent);
        throw e;
    }
    
}

function mergeAndDiff(current: StationsContent, previous: StationsContent): StationsContent {
    if (previous === undefined) {
        console.log("previous undefined");
        return current;
    }

    current.byStationCode.forEach((stationContent: StationContent, stationCode: string)=>{
        var previousStationContent = previous.byStationCode.get(stationCode);
        if (previousStationContent === undefined) {
            stationContent.deltaElectrical = stationContent.electrical;
            stationContent.deltaMechanical = stationContent.mechanical;
            stationContent.activity = stationContent.electrical + stationContent.mechanical;
        }
        else {
            var deltaElectrical = stationContent.electrical - previousStationContent.electrical;
            var deltaMechanical = stationContent.mechanical - previousStationContent.mechanical;
            var activity = Math.abs(deltaElectrical) + Math.abs(deltaMechanical);

            stationContent.deltaElectrical = deltaElectrical;
            stationContent.deltaMechanical = deltaMechanical;
            stationContent.activity = activity;

            if (deltaElectrical == 0 && deltaMechanical == 0) {
                stationContent.inactiveSince = previousStationContent.inactiveSince || previous.fetchDateTime;
            }
        }
    });

    console.log("merge finished "+current.fetchDateTime.toISOString());
    return current;
}