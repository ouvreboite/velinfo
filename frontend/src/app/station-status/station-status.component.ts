import { Component, Input } from '@angular/core';
import { Station, OfficialStatus, State } from '../current-stations.service';

@Component({
  selector: 'app-station-status',
  templateUrl: './station-status.component.html',
  styleUrls: ['./station-status.component.css']
})
export class StationStatusComponent {
  @Input() station: Station;
  constructor() { }
}