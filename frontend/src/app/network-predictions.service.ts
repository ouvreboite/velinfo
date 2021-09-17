import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { DailyActivityBaseService } from './daily-activity-base-service';

@Injectable({
  providedIn: 'root'
})
export class NetworkPredictionsService extends DailyActivityBaseService {
  constructor(http: HttpClient) {
    super(http);
  }

  getUrl(): string {
    return environment.apiUrl + '/network/predictions';
  }
}
