import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { DailyActivityBaseService } from './daily-activity-base-service';

@Injectable({
  providedIn: 'root'
})
export class NetworkActivityService extends DailyActivityBaseService{
  constructor(http: HttpClient) {
    super(http);
  }

  getUrl(): string {
    return environment.apiUrl+'/activity';
  }
}