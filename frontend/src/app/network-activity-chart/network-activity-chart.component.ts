import { Component, OnInit } from '@angular/core';
import { NetworkActivityService,  } from '../network-activity.service';
import { curveNatural } from 'd3-shape';
import { DailyActivity } from '../daily-activity-base-service';

@Component({
  selector: 'app-network-activity-chart',
  templateUrl: './network-activity-chart.component.html',
  styleUrls: ['./network-activity-chart.component.css']
})
export class GlobalActivityChartComponent implements OnInit {

  chartCurve: any = curveNatural;
  chartData: any[]; 
  chartColors = [];
  isLoading = true;

  constructor(
    private service: NetworkActivityService) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.service.getDailyActivity()
      .subscribe((data: DailyActivity) => {
        this.chartData = this.buildChartData(data);
        this.chartColors = this.buildChartColors(data);
        this.isLoading = false;
      });
  }

  buildChartData(networkActivity: DailyActivity): any[] {
    let data = networkActivity.hourlySortedActivity.map(stat => {
      return {
        "name": stat.timeslot+"h", 
        "value":Math.trunc(stat.activity/2)
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

  buildChartColors(networkActivity: DailyActivity): any[] {
    let colors = networkActivity.hourlySortedActivity.map(stat => {
      return {
        "name": stat.timeslot+"h", 
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
