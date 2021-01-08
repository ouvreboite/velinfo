import { Component, OnInit } from '@angular/core';
import { CurrentStations, CurrentStationsService, Station } from '../current-stations.service';

@Component({
  selector: 'app-stations-map-page',
  templateUrl: './stations-map-page.component.html',
  styleUrls: ['./stations-map-page.component.css']
})
export class StationsMapPageComponent implements OnInit {

  stations : Station[];
  displayUserPin = false;
  userLatitude = 48.8534;
  userLongitude = 2.3488;
  svgIcon = 'assets/bike.svg';
  
  constructor(
    private service: CurrentStationsService) { }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void{
    this.getUserLocation();
    this.service.getStations()
    .subscribe((data: CurrentStations) => {
        this.stations = data.stations;
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
