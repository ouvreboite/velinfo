import { Component, OnInit } from '@angular/core';
import { GlobalStatistics, GlobalStatisticsService } from '../global-statistics-service.service';
import { format } from 'date-fns';
import frLocale from 'date-fns/locale/fr'
import { curveCardinal } from 'd3-shape';

@Component({
  selector: 'app-global-activity-chart',
  templateUrl: './global-activity-chart.component.html',
  styleUrls: ['./global-activity-chart.component.css']
})
export class GlobalActivityChartComponent implements OnInit {

  chartCurve: any = curveCardinal;
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
      let datetime = new Date(new Date(stat.day).setHours(stat.hour));
      return {
        "name": new Date(new Date(stat.day).setHours(stat.hour)), 
        "formatedDateTime": this.formatDateTime(datetime),
        "value": stat.activity,
        "formatedValue": stat.activity.toLocaleString('fr')
      };
    })

    return [
      {
        "name": "Activité horaire",
        "series": data
      }
    ];
  }

  formatDateTime(date: Date): string{
    return format(date, "eeee HH",{
      locale: frLocale
    })+"h";
  }

}
