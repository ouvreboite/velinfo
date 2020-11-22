import axios from 'axios';
import { StationAvailability, StationsFetchedAvailabilities } from "../../common/domain";
export { fetchAvailabilities };

let parisAPIurl: string = 'https://opendata.paris.fr/api/records/1.0/search/?dataset=velib-disponibilite-en-temps-reel&q=&rows=10000';


async function fetchAvailabilities(): Promise<StationsFetchedAvailabilities> {
    const response = await axios.get(parisAPIurl);
    const fetchedAvailabilities = mapParisAPI(response.data);
    console.log(fetchedAvailabilities.byStationCode.size + " availabilities fetched from Paris API");
    return fetchedAvailabilities;
}

function mapParisAPI(data: any): StationsFetchedAvailabilities {
    let availabilitiesMap: Map<string, StationAvailability> = data.records
        .map(availabilityRecord => {
            var availability = new StationAvailability();
            availability.stationCode = availabilityRecord.fields.stationcode;
            availability.name = availabilityRecord.fields.name;
            availability.longitude = availabilityRecord.fields.coordonnees_geo[0];
            availability.latitude = availabilityRecord.fields.coordonnees_geo[1];
            availability.electrical = availabilityRecord.fields.ebike;
            availability.mechanical = availabilityRecord.fields.mechanical;
            availability.capacity = availabilityRecord.fields.capacity;
            availability.installed = availabilityRecord.fields.is_installed == "OUI";
            availability.renting = availabilityRecord.fields.is_renting == "OUI";
            availability.returning = availabilityRecord.fields.is_returning == "OUI";
            return availability;
        })
        .reduce(function (map: Map<string, StationAvailability>, availability: StationAvailability) {
            map.set(availability.stationCode, availability);
            return map;
        }, new Map<string, StationAvailability>());


    let dueDates = data.records.map(availabilityRecord => new Date(availabilityRecord.fields.duedate));
    let mostRecentDueDate = new Date(Math.max(...dueDates));

    var fetchedAvailabilities = new StationsFetchedAvailabilities();
    fetchedAvailabilities.byStationCode = availabilitiesMap;
    fetchedAvailabilities.fetchDateTime = new Date();
    fetchedAvailabilities.mostRecentOfficialDueDateTime = mostRecentDueDate;
    return fetchedAvailabilities;
}