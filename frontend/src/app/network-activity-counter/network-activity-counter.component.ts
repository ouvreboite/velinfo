import { Component, OnInit } from '@angular/core';
import { DailyActivity } from '../daily-activity-base-service';
import { NetworkActivityService } from '../network-activity.service';

@Component({
  selector: 'app-network-activity-counter',
  templateUrl: './network-activity-counter.component.html',
  styleUrls: ['./network-activity-counter.component.css']
})
export class GlobalActivityCounterComponent implements OnInit {
  view: [number, number] = [700, 400];
  chartData: any[]; 
  cardColor: string = '#a2b43a';
  textColor: string = '#ffffff';
  bandColor: string = '#a2b43a';

  isLoading = true;

  constructor(
    private service: NetworkActivityService) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.service.getDailyActivity()
      .subscribe((data: DailyActivity) => {
        this.chartData = this.buildChartData(data);
        this.isLoading = false;
      });
  }

  buildChartData(networkActivity: DailyActivity): any[] {
    networkActivity.totalActivity
    return [ {
      "name": "Trajets",
      "value": Math.trunc(networkActivity.totalActivity/2)
    }];
  }


}
