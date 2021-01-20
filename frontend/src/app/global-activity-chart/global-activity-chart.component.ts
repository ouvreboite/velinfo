import { Component, OnInit } from '@angular/core';
import { GlobalStatistics, GlobalStatisticsService } from '../global-statistics-service.service';
import { curveNatural } from 'd3-shape';

@Component({
  selector: 'app-global-activity-chart',
  templateUrl: './global-activity-chart.component.html',
  styleUrls: ['./global-activity-chart.component.css']
})
export class GlobalActivityChartComponent implements OnInit {

  chartCurve: any = curveNatural;
  chartData: any[]; 
  chartColorScheme = {
    domain: ['#59b0e3']
  };
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
    let data = globalStatistics.statistics.map(stat => {
      return {
        "name": stat.hour+"h", 
        "value":stat.activity
      };
    });

    for(let i=data.length; i<24;i++){
      data.push({
        "name": i+"h", 
        "value":0
      });
    }

    return data;
  }

}
