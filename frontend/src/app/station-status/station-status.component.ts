import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Station, OfficialStatus, State } from '../current-stations.service';
import { StationStatusService } from '../station-status.service';

@Component({
  selector: 'app-station-status',
  templateUrl: './station-status.component.html',
  styleUrls: ['./station-status.component.css']
})
export class StationStatusComponent implements OnInit, OnChanges  {
 
  detailCSSClass: string;
  statusEmoji: string;
  statusText: string;
  @Input() station: Station;
  @Input() forceDetails: boolean = false;
  
  constructor( private stationStatusService: StationStatusService) { }

  ngOnInit() {
    this.statusEmoji = this.stationStatusService.getStatusEmoji(this.station);
    this.statusText = this.stationStatusService.getStatusText(this.station);
    this.detailCSSClass = this.forceDetails?'force-details':'hiddable-details';
  }

  ngOnChanges() {
    this.ngOnInit();
  }
}