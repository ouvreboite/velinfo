import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { fr } from 'date-fns/locale'

@Injectable({
  providedIn: 'root'
})
export class CurrentStationsService {

  constructor(private http: HttpClient) {
  }

  configUrl = 'https://api.velinfo.fr/stations';

  getStations(): Observable<CurrentStations> {
    return this.http.get<CurrentStations>(this.configUrl)
      .pipe(
        map(stations => this.mapDateAttributes(stations)),
        map(stations => this.addLastActivityAgo(stations)),
        map(stations => this.addOccupation(stations))
      )
  }

  mapDateAttributes(currentStations : CurrentStations): CurrentStations {
    currentStations.stations.forEach(station => {
      station.lastActivity = station.lastActivity?new Date(station.lastActivity): null;
    });

    return currentStations;
  }

  addLastActivityAgo(currentStations: CurrentStations): CurrentStations{
    let now = new Date();
    currentStations.stations.forEach(station => {
      station.lastActivity = station.coldSince?new Date(station.coldSince):now;
      station.lastActivityAgo = formatDistanceToNow(station.lastActivity, {locale: fr});
    });
    return currentStations;
  }

  addOccupation(currentStations: CurrentStations): CurrentStations{
    currentStations.stations.forEach(station => {
      station.occupation = (station.electrical+station.mechanical)/station.capacity;
    });
    return currentStations;
  }
}

export class Station{
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  state: State;
  capacity: number;
  electrical: number;
  mechanical: number;
  empty: number;
  occupation: number;
  officialStatus: OfficialStatus;
  coldSince: Date;
  lastActivity : Date;
  lastActivityAgo : string;
  expectedActivity?: number;
}

export class CurrentStations{
  fetchDateTime: Date;
  mostRecentOfficialDueDateTime: Date;
  stations: Station[];
}

export enum State {
    Ok = "Ok",
    Cold = "Cold",
    Locked = "Locked"
}

export enum OfficialStatus {
    Ok = "Ok",
    NotInstalled = "NotInstalled",
    NotRenting = "NotRenting",
    NotReturning = "NotReturning",
    NotRentingNotReturning = "NotRentingNotReturning"
}