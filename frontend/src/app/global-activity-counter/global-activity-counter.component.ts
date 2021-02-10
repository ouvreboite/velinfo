import { Component, OnInit } from '@angular/core';
import { GlobalStatistics, GlobalStatisticsService } from '../global-statistics.service';

@Component({
  selector: 'app-global-activity-counter',
  templateUrl: './global-activity-counter.component.html',
  styleUrls: ['./global-activity-counter.component.css']
})
export class GlobalActivityCounterComponent implements OnInit {
  view: [number, number] = [700, 400];
  chartData: any[]; 
  cardColor: string = '#a2b43a';
  textColor: string = '#ffffff';
  bandColor: string = '#a2b43a';

  isLoading = true;

  constructor(
    private service: GlobalStatisticsService) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.service.getGlobalStatistics()
      .subscribe((data: GlobalStatistics) => {
        this.chartData = this.buildChartData(data);
        this.isLoading = false;
      });
  }

  buildChartData(globalStatistics: GlobalStatistics): any[] {
    globalStatistics.statistics
    return [ {
      "name": "Trajets",
      "value": Math.trunc(globalStatistics.todaysActivity/2)
    }];
  }


}
