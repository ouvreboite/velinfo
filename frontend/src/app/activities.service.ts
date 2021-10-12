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
  private predictionByStationUrl = environment.apiUrl+'/prediction/by-station';
  private activityByStationUrl = environment.apiUrl+'/activity/by-station';
  private predictionLoadTimestamp: Date;
  private actualLoadTimestamp: Date;
  private predictionActivities: Activities;
  private actualActivities: Activities;
  private predictionObservable: Observable<Activities>; 
  private actualObservable: Observable<Activities>; 

  constructor(private http: HttpClient) {
  }

  getStationDetailledActivities(stationCode: string, type: ActivityType): Observable<Activity>{
    return this.getActivities(type)
      .pipe(
        map(activities => 
          activities.accurateActivities.find(act => act.stationCode === stationCode)
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

  getGlobalDetailledActivites(type: ActivityType): Observable<Activity>{
    return this.getActivities(type)
      .pipe(
        map(activities => {
          let globalActivities : number[] = new Array(activities.accurateActivities[0].activity.length).fill(0);
          activities.accurateActivities.map(stationActivities => stationActivities.activity).forEach(stationActivities=>{
            stationActivities.forEach((activity, index)=>{globalActivities[index]+=activity});
          })
          return {
            stationCode: null,
            activity: globalActivities
          };
          }
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
      case ActivityType.Prediction:
        return this.predictionActivities;
      case ActivityType.Actual:
        return this.actualActivities;
    }
  } 

  private setCached(type: ActivityType, activities: Activities){
    switch(type){
      case ActivityType.Prediction:
        this.predictionActivities = activities;
        break;
      case ActivityType.Actual:
        this.actualActivities = activities;
        break;
    }
  } 

  private getObservable(type: ActivityType):Observable<Activities>{
    switch(type){
      case ActivityType.Prediction:
        return this.predictionObservable;
      case ActivityType.Actual:
        return this.actualObservable;
    }
  } 

  private setObservable(type: ActivityType, observable: Observable<Activities>){
    switch(type){
      case ActivityType.Prediction:
        this.predictionObservable = observable;
        break;
      case ActivityType.Actual:
        this.actualObservable = observable;
        break;
    }
  } 

  private fetchActivities(type: ActivityType): Observable<Activities>{
    switch(type){
      case ActivityType.Prediction:
        this.predictionLoadTimestamp = new Date();
        return this.http.get<Activities>(this.predictionByStationUrl);
      case ActivityType.Actual:
        this.predictionLoadTimestamp = new Date();
        return this.http.get<Activities>(this.activityByStationUrl);
    }
  }

  private invalidCacheIfNecessary(type: ActivityType){
    switch(type){
      case ActivityType.Prediction:
        if(!this.predictionLoadTimestamp || differenceInSeconds(new Date(), this.predictionLoadTimestamp) > 60 ){
          this.predictionLoadTimestamp = null;
          this.predictionActivities = null;
          this.predictionObservable = null;
        }
        break;
      case ActivityType.Actual:
        if(!this.actualLoadTimestamp || differenceInSeconds(new Date(), this.predictionLoadTimestamp) > 60 ){
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
  Prediction,
  Actual
}
