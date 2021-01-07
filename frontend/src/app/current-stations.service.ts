import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as moment from 'moment';
import { Moment } from 'moment';

@Injectable({
  providedIn: 'root'
})
export class CurrentStationsService {

  constructor(private http: HttpClient) {
    moment.locale('fr');
  }

  configUrl = 'https://api.velinfo.fr/stations';

  getStations(): Observable<CurrentStations> {
    return this.http.get<CurrentStations>(this.configUrl)
      .pipe(
        map(stations => this.addLastActivityAgo(stations)),
        map(stations => this.addOccupation(stations))
      )
  }

  addLastActivityAgo(currentStations: CurrentStations): CurrentStations{
    let now = moment();
    currentStations.stations.forEach(station => {
      station.lastActivity = station.coldSince?moment(station.coldSince):now;
      station.lastActivityAgo = station.lastActivity.fromNow(true);
    });
    return currentStations;
  }

  addOccupation(currentStations: CurrentStations): CurrentStations{
    currentStations.stations.forEach(station => {
      station.occupation = (station.electrical+station.mechanical)/station.capacity;
    });
    console.log(currentStations);
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
  lastActivity : Moment;
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