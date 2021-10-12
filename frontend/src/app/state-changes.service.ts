import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { differenceInSeconds } from 'date-fns';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ActivityStatus, OfficialStatus } from './current-stations.service';

@Injectable({
  providedIn: 'root'
})
export class StateChangesService {

  private url = environment.apiUrl+'/state-changes';
  private loadTimestamp: Date;
  private stateChanges: StateChanges;
  private observable: Observable<StateChanges>; 

  constructor(private http: HttpClient) {
  }

  getStateChanges(): Observable<StateChanges> {
    this.invalidCacheIfNecessary()

    if (this.stateChanges) {
      return of(this.stateChanges);
    } else if (this.observable) {
      return this.observable;
    } else {
      this.observable = this.fetchStateChanges()
      .pipe(
        map(stateChanges => {
          this.observable = null;
          this.stateChanges = stateChanges;
          this.retypeDates(this.stateChanges);
          this.filterActivityChangeOnOfficiallyStoppedStations(this.stateChanges);
          return stateChanges;
        }));
      return this.observable;
    }
  }

  private filterActivityChangeOnOfficiallyStoppedStations(stateChanges: StateChanges) {
    stateChanges.stationStateChanges = stateChanges.stationStateChanges
      .filter(change => change.newState.officialStatus != change.oldState.officialStatus || change.newState.officialStatus == OfficialStatus.Ok);
  }

  private fetchStateChanges(): Observable<StateChanges>{
    this.loadTimestamp = new Date();
    return this.http.get<StateChanges>(this.url);
  }

  private invalidCacheIfNecessary(){
    if(!this.loadTimestamp || differenceInSeconds(new Date(), this.loadTimestamp) > 60 ){
      this.loadTimestamp = null;
      this.stateChanges = null;
      this.observable = null;
    }
  }
  
  private retypeDates(stateChanges: StateChanges) {
    stateChanges.stationStateChanges.forEach(change => {
      change.datetime = new Date(change.datetime);
    })
  }
}

export class StateChanges{
  stationStateChanges: StationStateChange[];
}

export class StationStateChange {
  datetime: Date;
  stationCode: string;
  stationName: string;
  oldState: StationState;
  newState: StationState;
}

export class StationState {
  activityStatus: ActivityStatus;
  officialStatus: OfficialStatus;
  missingActivity: number;
  inactiveSince?: Date;
}
