import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import differenceInSeconds from 'date-fns/differenceInSeconds';
import { fr } from 'date-fns/locale';

@Injectable({
  providedIn: 'root'
})
export class CurrentStationsService {
  private configUrl = 'https://api.velinfo.fr/stations';
  private loadTimestamp: Date;
  private currentStations: CurrentStations;
  private observable: Observable<CurrentStations>; 

  constructor(private http: HttpClient) {
  }

  getStations(): Observable<CurrentStations> {
    this.invalidCacheIfNecessary()

    if (this.currentStations) {
      return of(this.currentStations);
    } else if (this.observable) {
      return this.observable;
    } else {
      this.observable = this.fetchStations()
      .pipe(
        map(stations => {
          this.observable = null;
          this.currentStations = stations;
          return stations;
        }));
      return this.observable;
    }
  }

  private fetchStations(): Observable<CurrentStations>{
    this.loadTimestamp = new Date();
    return this.http.get<CurrentStations>(this.configUrl)
    .pipe(
      map(stations => this.mapDateAttributes(stations)),
      map(stations => this.roundMissingActivity(stations)),
      map(stations => this.addLastActivityAgo(stations)),
      map(stations => this.addOccupation(stations)),
    )
  }

  private invalidCacheIfNecessary(){
    if(!this.loadTimestamp || differenceInSeconds(new Date(), this.loadTimestamp) > 60 ){
      this.loadTimestamp = null;
      this.currentStations = null;
      this.observable = null;
    }
  }

  private mapDateAttributes(currentStations : CurrentStations): CurrentStations {
    currentStations.stations.forEach(station => {
      station.lastActivity = station.lastActivity?new Date(station.lastActivity): null;
    });

    return currentStations;
  }

  private addLastActivityAgo(currentStations: CurrentStations): CurrentStations{
    let now = new Date();
    currentStations.stations.forEach(station => {
      station.lastActivity = station.coldSince?new Date(station.coldSince):now;
      station.lastActivityAgo = formatDistanceToNow(station.lastActivity, {locale: fr});
    });
    return currentStations;
  }

  private addOccupation(currentStations: CurrentStations): CurrentStations{
    currentStations.stations.forEach(station => {
      station.occupation = (station.electrical+station.mechanical)/station.capacity;
    });
    return currentStations;
  }

  private roundMissingActivity(currentStations: CurrentStations): CurrentStations{
    currentStations.stations.forEach(station => {
      station.missingActivity = Math.round(station.missingActivity);
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
  missingActivity?: number;
}

export class CurrentStations{
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