import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { differenceInSeconds } from 'date-fns';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GlobalStatisticsService {
  private configUrl = 'https://api.velinfo.fr/global-statistics';
  private loadTimestamp: Date;
  private globalStatistics: GlobalStatistics;
  private observable: Observable<GlobalStatistics>; 

  constructor(private http: HttpClient) {
  }

  getGlobalStatistics(): Observable<GlobalStatistics> {
    this.invalidCacheIfNecessary()

    if (this.globalStatistics) {
      return of(this.globalStatistics);
    } else if (this.observable) {
      return this.observable;
    } else {
      this.observable = this.fetchGlobalStatisics()
      .pipe(
        map(globalStatistics => {
          this.observable = null;
          this.globalStatistics = globalStatistics;
          return globalStatistics;
        }));
      return this.observable;
    }
  }

  private fetchGlobalStatisics(): Observable<GlobalStatistics>{
    this.loadTimestamp = new Date();
    return this.http.get<GlobalStatistics>(this.configUrl);
  }

  private invalidCacheIfNecessary(){
    if(!this.loadTimestamp || differenceInSeconds(new Date(), this.loadTimestamp) > 60 ){
      this.loadTimestamp = null;
      this.globalStatistics = null;
      this.observable = null;
    }
  }
}

export class GlobalStatistic{
    day: string;
    hour: number;
    activity: number;
}

export class GlobalStatistics{
    statistics: GlobalStatistic[] = [];
    todaysActivity: number;
}