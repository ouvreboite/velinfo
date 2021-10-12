import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import * as shape from 'd3-shape';
import format from 'date-fns/format';
import { fr } from 'date-fns/locale';
import { NetworkActivityService } from '../network-activity.service';
import { NetworkPredictionsService } from '../network-predictions.service';
import { DailyActivity } from '../daily-activity-base-service';

@Component({
  selector: 'app-network-detailled-activity-chart',
  templateUrl: './network-detailled-activity-chart.component.html',
  styleUrls: ['./network-detailled-activity-chart.component.css']
})
export class NetworkDetailledActivityChartComponent implements OnInit {
  chartData: any[]; 
  isLoading = true;
  chartColorScheme = {
    domain: ['#C0C0C0', '#59b0e3']
  };
  curve = shape.curveLinear;

  constructor(
    private activityService: NetworkActivityService, 
    private predictionsService: NetworkPredictionsService) { }

  ngOnInit(): void {
    this.isLoading = true;

    forkJoin(
      {
        actual: this.activityService.getDailyActivity(),
        prediction: this.predictionsService.getDailyActivity()
      }
    ).subscribe(({actual,prediction})=>{
        this.chartData = this.buildChartData(actual, prediction);
        this.isLoading = false;
    });
  }

  public axisFormat(tick: string) {
    if(tick.endsWith('00'))
      return tick;
    return '';
 }

  private indexToTime(index: number): string{
    let hours = Math.floor(index/6)+"";
    let minutes = (index%6)*10+"";
    return hours.padStart(2, '0')+":"+minutes.padStart(2, '0');
  }

  buildChartData(actual: DailyActivity, prediction: DailyActivity): any[] {
    let predictionValues = prediction.sortedActivity
      .map((value, index) => {
        return {
          "name": this.indexToTime(index),
          "value": value.activity
        };
      });

    let actualValues = actual.sortedActivity
      .map((value, index) => {
        return {
          "name": this.indexToTime(index),
          "value": value.activity
        };
      });

    return [
      {
        name: "Habituellement le "+format(new Date(), 'eeee', {locale: fr}),
        series: predictionValues
      },
      {
        name: "Aujourd'hui",
        series: actualValues
      }
    ];
  }

  

}
