import { Component, Input, OnInit } from '@angular/core';
import { Station } from '../current-stations.service';

@Component({
  selector: 'app-station-availability-bar',
  templateUrl: './station-availability-bar.component.html',
  styleUrls: ['./station-availability-bar.component.css']
})
export class StationAvailabilityBarComponent implements OnInit {
  @Input() station: Station;
  @Input() displayMode = "auto";

  electricalPct = "0%";
  mechanicalPct = "0%";
  emptyPct = "100%";
  lockedPct = "0%";
  locked=0;

  progressCSS = "onBigScreen";
  miniCSS = "onSmallScreen";

  constructor() { }

  ngOnInit(): void {
    if(this.displayMode == "progress"){
      this.progressCSS="";
      this.miniCSS="hide";
    }else if(this.displayMode == "mini"){
      this.progressCSS="hide";
      this.miniCSS="";
    }

    if(this.station.capacity != 0){
      this.electricalPct = 100*this.station.electrical/this.station.capacity+"%";
      this.mechanicalPct = 100*this.station.mechanical/this.station.capacity+"%";
      this.emptyPct = 100*this.station.empty/this.station.capacity+"%";
      this.locked = this.station.capacity-(this.station.empty+this.station.electrical+this.station.mechanical);
      this.lockedPct = 100*this.locked/this.station.capacity+"%";
    }
  }
}
