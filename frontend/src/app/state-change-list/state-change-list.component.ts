import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { forkJoin } from 'rxjs';
import { CurrentStationsService, Station } from '../current-stations.service';
import { StateChanges, StateChangesService, StationStateChange } from '../state-changes.service';
import { StationStatusService } from '../station-status.service';

@Component({
  selector: 'app-state-change-list',
  templateUrl: './state-change-list.component.html',
  styleUrls: ['./state-change-list.component.css']
})
export class StateChangeListComponent implements OnInit {
  isLoading = true;
  changes: StationStateChange[];
  private stations: Map<string, Station>;

  constructor(
    private stateChangesService: StateChangesService, 
    private currentStationsService: CurrentStationsService,
    private stationStatusService: StationStatusService) { }

  ngOnInit(): void {
    forkJoin(
      {
        changes:  this.stateChangesService.getStateChanges(),
        stations: this.currentStationsService.getStations()
      }
    ).subscribe((observable)=>{
      this.stations = observable.stations.stations.reduce((map, station)=> {
        map.set(station.code, station);
        return map;
      }, new Map<string, Station>());


      this.changes= observable.changes.stationStateChanges;
      this.changes.sort((a, b) => b.datetime.getTime() - a.datetime.getTime());
      this.isLoading = false;
    });
  }

  getStationName(code: string): string{
    return this.stations.get(code)?.name;
  }

  getChangeText(change: StationStateChange): string{
    return this.stationStatusService.getStatusChangeText(change);
  }

}
