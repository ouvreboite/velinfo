import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { differenceInSeconds } from 'date-fns';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ActivitiesService {
  private expectedUrl = environment.apiUrl+'/activities/expected';
  private actualUrl = environment.apiUrl+'/activities/actual';
  private expectedLoadTimestamp: Date;
  private actualLoadTimestamp: Date;
  private expectedActivities: Activities;
  private actualActivities: Activities;
  private expectedObservable: Observable<Activities>; 
  private actualObservable: Observable<Activities>; 

  constructor(private http: HttpClient) {
  }

  getStationActivities(stationCode: string, type: ActivityType): Observable<Activity>{
    return this.getActivities(type)
      .pipe(
        map(activities => 
          activities.accurateActivities.find(hourly => hourly.stationCode === stationCode)
        )
      );
  }

  getTotalActivitiesByStation(type: ActivityType): Observable<Map<string, number>>{
    return this.getActivities(type)
    .pipe(
      map(activities => activities.accurateActivities.reduce(function(map, accurateActivity) 
        {
        map.set(accurateActivity.stationCode,accurateActivity.activity.reduce((a, b) => a + b, 0));
        return map;
        }, 
        new Map<string,number>())
      )
    );
  }

  private getActivities(type: ActivityType): Observable<Activities> {
    this.invalidCacheIfNecessary(type)

    if (this.getCached(type)) {
      return of(this.getCached(type));
    } else if (this.getObservable(type)) {
      return this.getObservable(type);
    } else {
      let observable$ = this.fetchActivities(type)
      .pipe(
        map(activities => {
          this.setObservable(type, null);
          this.setCached(type,activities);
          return activities;
        }));
      this.setObservable(type, observable$);
      return observable$;
    }
  }

  private getCached(type: ActivityType):Activities{
    switch(type){
      case ActivityType.Expected:
        return this.expectedActivities;
      case ActivityType.Actual:
        return this.actualActivities;
    }
  } 

  private setCached(type: ActivityType, activities: Activities){
    switch(type){
      case ActivityType.Expected:
        this.expectedActivities = activities;
        break;
      case ActivityType.Actual:
        this.actualActivities = activities;
        break;
    }
  } 

  private getObservable(type: ActivityType):Observable<Activities>{
    switch(type){
      case ActivityType.Expected:
        return this.expectedObservable;
      case ActivityType.Actual:
        return this.actualObservable;
    }
  } 

  private setObservable(type: ActivityType, observable: Observable<Activities>){
    switch(type){
      case ActivityType.Expected:
        this.expectedObservable = observable;
        break;
      case ActivityType.Actual:
        this.actualObservable = observable;
        break;
    }
  } 

  private fetchActivities(type: ActivityType): Observable<Activities>{
    switch(type){
      case ActivityType.Expected:
        this.expectedLoadTimestamp = new Date();
        return this.http.get<Activities>(this.expectedUrl);
      case ActivityType.Actual:
        this.expectedLoadTimestamp = new Date();
        return this.http.get<Activities>(this.actualUrl);
    }
  }

  private invalidCacheIfNecessary(type: ActivityType){
    switch(type){
      case ActivityType.Expected:
        if(!this.expectedLoadTimestamp || differenceInSeconds(new Date(), this.expectedLoadTimestamp) > 60 ){
          this.expectedLoadTimestamp = null;
          this.expectedActivities = null;
          this.expectedObservable = null;
        }
        break;
      case ActivityType.Actual:
        if(!this.actualLoadTimestamp || differenceInSeconds(new Date(), this.expectedLoadTimestamp) > 60 ){
          this.actualLoadTimestamp = null;
          this.actualActivities = null;
          this.actualObservable = null;
        }
        break;
    }
  }
}

class Activities{
  accurateActivities: Activity[] = [];
}

export class Activity{
  stationCode: string;
  activity: number[];
}

export enum ActivityType {
  Expected,
  Actual
}
