import { Component, OnInit } from '@angular/core';
import { GlobalStatistics, GlobalStatisticsService } from '../global-statistics.service';
import { curveNatural } from 'd3-shape';

@Component({
  selector: 'app-global-activity-chart',
  templateUrl: './global-activity-chart.component.html',
  styleUrls: ['./global-activity-chart.component.css']
})
export class GlobalActivityChartComponent implements OnInit {

  chartCurve: any = curveNatural;
  chartData: any[]; 
  chartColors = [];
  isLoading = true;

  constructor(
    private service: GlobalStatisticsService) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.service.getGlobalStatistics()
      .subscribe((data: GlobalStatistics) => {
        this.chartData = this.buildChartData(data);
        this.chartColors = this.buildChartColors(data);
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

  buildChartColors(globalStatistics: GlobalStatistics): any[] {
    let colors = globalStatistics.statistics.map(stat => {
      return {
        "name": stat.hour+"h", 
        "value":"#59b0e3"
      };
    });

    let lastHour = colors.pop();
    lastHour.value = "#a2b43a";
    colors.push(lastHour);

    for(let i=colors.length; i<24;i++){
      colors.push({
        "name": i+"h", 
        "value":"#59b0e3"
      });
    }

    return colors;
  }
  

}
