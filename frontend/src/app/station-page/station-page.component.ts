import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { CurrentStations, CurrentStationsService, Station } from '../current-stations.service';

@Component({
  selector: 'app-station-page',
  templateUrl: './station-page.component.html',
  styleUrls: ['./station-page.component.css']
})
export class StationPageComponent implements OnInit {
  isLoading = true;
  code: string;
  station : Station;

  constructor(
    private service: CurrentStationsService,
    private activatedRoute: ActivatedRoute) {
  }

  ngOnInit() {   
    this.code = this.activatedRoute.snapshot.paramMap.get('code');
    this.service.getStations()
    .subscribe((data: CurrentStations) => {
        this.station = data.stations.find(station => station.code == this.code);
        console.log(this.station);
        this.isLoading = false;
      }
    )
  }
}
