import { Component, OnInit } from '@angular/core';
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
    private stationService: CurrentStationsService) { }

  ngOnInit(): void {
    this.isLoading = true;

    this.stationService.getStations().subscribe((data: CurrentStations)=>{
        this.stations = data.stations;
        this.numberOfStations = this.stations.length;
        this.isLoading = false;
    });
  }
}