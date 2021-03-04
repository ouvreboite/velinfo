import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { forkJoin } from 'rxjs';
import { ActivitiesService, ActivityType } from '../activities.service';
import { CurrentStations, CurrentStationsService, Station } from '../current-stations.service';

@Component({
  selector: 'app-stations-list-page',
  templateUrl: './stations-list-page.component.html',
  styleUrls: ['./stations-list-page.component.css']
})
export class StationsListPageComponent implements OnInit {
  stations : Station[];

  isLoading = true;
  numberOfStations = 0;

  constructor(
    private stationService: CurrentStationsService,
    private activitiesService: ActivitiesService) { }

  ngOnInit(): void {
    this.isLoading = true;

    forkJoin(
      {
        stations:  this.stationService.getStations(),
        todaysActivities: this.activitiesService.getTotalActivitiesByStation(ActivityType.Actual)
      }
    ).subscribe((observable)=>{
        this.stations = observable.stations.stations;

        this.stations.forEach(station =>{
          const todaysActivity = observable.todaysActivities.get(station.code);
          station.todaysActivity = todaysActivity;
        })
        this.numberOfStations = this.stations.length;
        this.isLoading = false;
    });
  }
}