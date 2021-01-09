import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrentStations, CurrentStationsService, Station } from '../current-stations.service';
import { StationStatusService } from '../station-status.service';

@Component({
  selector: 'app-station-page',
  templateUrl: './station-page.component.html',
  styleUrls: ['./station-page.component.css']
})
export class StationPageComponent implements OnInit {
  isLoading = true;
  code: string;
  station : Station;
  displayUserPin = false;
  userLatitude: number;
  userLongitude: number;
  stationIcon;

  constructor(
    private currentStationsService: CurrentStationsService,
    private stationStatusService: StationStatusService,
    private activatedRoute: ActivatedRoute) {
  }

  ngOnInit() {   
    this.code = this.activatedRoute.snapshot.paramMap.get('code');
    this.getUserLocation();
    this.currentStationsService.getStations()
    .subscribe((data: CurrentStations) => {
        this.station = data.stations.find(station => station.code == this.code);
        this.stationIcon = this.stationStatusService.getStatusMapIcon(this.station);
        this.isLoading = false;
      }
    )
  }

  getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        this.userLatitude = position.coords.latitude;
        this.userLongitude = position.coords.longitude;
        this.displayUserPin = true;
      });
    }
  }
}
