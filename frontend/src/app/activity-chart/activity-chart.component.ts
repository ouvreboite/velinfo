import { Component, Input, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ActivitiesService, HourlyActivity, ActivityType } from '../activities.service';
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
  curve = shape.curveCatmullRom;

  constructor(
    private activitiesService: ActivitiesService) { }

  ngOnInit(): void {
    this.isLoading = true;

    forkJoin(
      {
        expected: this.activitiesService.getStationActivities(this.station.code, ActivityType.Expected),
        actual: this.activitiesService.getStationActivities(this.station.code, ActivityType.Actual)
      }
    ).subscribe((activity)=>{
        this.chartData = this.buildChartData(activity.expected, activity.actual);
        this.isLoading = false;
        this.todaysActivity = activity.actual.hourlyActivity.reduce((a,b)=> a+b, 0);
    });
  }


  buildChartData(expected: HourlyActivity, actual: HourlyActivity): any[] {
    let expectedValues = expected.hourlyActivity
      .map((value, hour) => {
        return {
          "name": hour+"h",
          "value": value
        };
      });

    let actualValues = actual.hourlyActivity
      .map((value, hour) => {
        return {
          "name": hour+"h",
          "value": value
        };
      });

    return [
      {
        name: "Habituellement le "+format(new Date(), 'eeee', {locale: fr}),
        series: expectedValues
      },
      {
        name: "Aujourd'hui",
        series: actualValues
      }
    ];
  }

  

}
