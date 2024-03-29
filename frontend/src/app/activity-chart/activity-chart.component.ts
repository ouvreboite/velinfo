import { Component, Input, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ActivitiesService, Activity, ActivityType } from '../activities.service';
import { Station } from '../current-stations.service';
import * as shape from 'd3-shape';
import format from 'date-fns/format';
import { fr } from 'date-fns/locale';

@Component({
  selector: 'app-activity-chart',
  templateUrl: './activity-chart.component.html',
  styleUrls: ['./activity-chart.component.css']
})
export class ActivityChartComponent implements OnInit {
  @Input() station: Station;
  chartData: any[]; 
  todaysActivity: number;
  isLoading = true;
  chartColorScheme = {
    domain: ['#C0C0C0', '#59b0e3']
  };
  curve = shape.curveLinear;

  constructor(
    private activitiesService: ActivitiesService) { }

  ngOnInit(): void {
    this.isLoading = true;

    forkJoin(
      {
        prediction: this.station ? 
          this.activitiesService.getStationDetailledActivities(this.station.code, ActivityType.Prediction)
           : this.activitiesService.getGlobalDetailledActivites(ActivityType.Prediction),
        actual: this.station ? 
          this.activitiesService.getStationDetailledActivities(this.station.code, ActivityType.Actual)
           : this.activitiesService.getGlobalDetailledActivites(ActivityType.Actual)
      }
    ).subscribe((activity)=>{
        this.chartData = this.buildChartData(activity.prediction, activity.actual);
        this.isLoading = false;
        this.todaysActivity = activity.actual.activity.reduce((a,b)=> a+b, 0);
    });
  }

  public axisFormat(tick: string) {
    if(tick.endsWith('00'))
      return tick;
    return '';
 }

  private indexToTime(index: number): string{
    let hours = Math.floor(index/2)+"";
    let minutes = (index%2)*30+"";
    return hours.padStart(2, '0')+":"+minutes.padStart(2, '0');
  }

  buildChartData(prediction: Activity, actual: Activity): any[] {
    let predictionValues = prediction.activity
      .map((value, index) => {
        return {
          "name": this.indexToTime(index),
          "value": value
        };
      });

    let actualValues = actual.activity
      .map((value, index) => {
        return {
          "name": this.indexToTime(index),
          "value": value
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
