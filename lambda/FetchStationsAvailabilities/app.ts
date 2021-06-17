import "reflect-metadata";
import {fetchAvailabilities} from "./velibStationsStatusClient";
import {updateAvailabilities, getAvailabilities} from "../common/repository/availabilitiesDynamoRepository";
import {StationAvailability, StationsFetchedAvailabilities} from "../common/domain";

export const lambdaHandler = async (event: any) => {
    let [newAvailabilities, previousAvailabilities] = await Promise.all([fetchAvailabilities(), getAvailabilities()]);
    let mergedAvailabilities = mergeAndDiff(newAvailabilities, previousAvailabilities);
    await updateAvailabilities(mergedAvailabilities);
}

function mergeAndDiff(current: StationsFetchedAvailabilities, previous: StationsFetchedAvailabilities): StationsFetchedAvailabilities {
    if (previous === undefined) {
        console.log("previous undefined");
        return current;
    }

    current.byStationCode.forEach((currAvailability: StationAvailability, stationCode: string)=>{
        var prevAvailability = previous.byStationCode.get(stationCode);
        if (prevAvailability === undefined) {
            currAvailability.deltaElectrical = currAvailability.electrical;
            currAvailability.deltaMechanical = currAvailability.mechanical;
            currAvailability.activity = currAvailability.electrical + currAvailability.mechanical;
        }
        else {
            var deltaElectrical = currAvailability.electrical - prevAvailability.electrical;
            var deltaMechanical = currAvailability.mechanical - prevAvailability.mechanical;
            var activity = Math.abs(deltaElectrical) + Math.abs(deltaMechanical);

            currAvailability.deltaElectrical = deltaElectrical;
            currAvailability.deltaMechanical = deltaMechanical;
            currAvailability.activity = activity;

            if (deltaElectrical == 0 && deltaMechanical == 0) {
                currAvailability.inactiveSince = prevAvailability.inactiveSince || previous.fetchDateTime;
            }
        }
    });

    console.log("merge finished "+current.fetchDateTime.toISOString());
    return current;
}