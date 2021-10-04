import { Component, OnInit } from '@angular/core';
import { CurrentStations, CurrentStationsService, Station } from '../current-stations.service';
import { StationStatusService } from '../station-status.service';

@Component({
  selector: 'app-stations-map-page',
  templateUrl: './stations-map-page.component.html',
  styleUrls: ['./stations-map-page.component.css'],
})
export class StationsMapPageComponent implements OnInit {

  stations : Station[];
  isLoading = true;
  displayUserPin = false;
  userLatitude = 48.8534;
  userLongitude = 2.3488;
  fullIcon=true;
  
  selectedStation : Station;
  iwLatitude = 48.8534;
  iwLongitude = 2.3488;

  constructor(
    private currentStationsService: CurrentStationsService,
    private stationStatusService: StationStatusService) { }

  ngOnInit(): void {
    this.getUserLocation();
    this.currentStationsService.getStations()
    .subscribe((data: CurrentStations) => {
        this.stations = data.stations;
        this.isLoading = false;
      }
    )
  }

  getStationIcon(station: Station){
    return this.stationStatusService.getStatusMapIcon(station);
  }

  getStationSmallPin(station: Station){
    return this.stationStatusService.getStatusMapSmallIcon(station);
  }

  private getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        this.userLatitude = +position.coords.latitude;
        this.userLongitude = +position.coords.longitude;
        this.displayUserPin = true;
      });
    }
  }

  zoomChange(zoomLevel: number){
    if(zoomLevel<16)
      this.fullIcon = false;
    else
      this.fullIcon = true;
  }

  markerClick(station, iw){
    this.selectedStation = station;
    this.iwLatitude = station.latitude;
    this.iwLongitude = station.longitude;
    iw.open();
   }
}
