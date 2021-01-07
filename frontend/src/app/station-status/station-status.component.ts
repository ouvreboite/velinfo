import { Component, Input, OnInit } from '@angular/core';
import { Station, OfficialStatus, State } from '../current-stations.service';

@Component({
  selector: 'app-station-status',
  templateUrl: './station-status.component.html',
  styleUrls: ['./station-status.component.css']
})
export class StationStatusComponent implements OnInit {
 
  detailCSSClass: string;
  @Input() station: Station;
  @Input() forceDetails: boolean = false;
  
  constructor() { }

  ngOnInit() {
    this.detailCSSClass = this.forceDetails?'force-details':'hiddable-details';
  }
}