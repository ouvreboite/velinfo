import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { CurrentStations, CurrentStationsService, Station } from '../current-stations.service';

@Component({
  selector: 'app-station-table',
  templateUrl: './station-table.component.html',
  styleUrls: ['./station-table.component.css']
})
export class StationTableComponent implements OnInit {
  isLoading = true;
  onlyBlocked = false;
  dataSource = new MatTableDataSource<Station>();
  displayedColumns: string[] = ['name', 'occupation', 'status', 'lastActivityAgo'];

  @ViewChild(MatSort) sort: MatSort;

  private stations : Station[];
  constructor(
    private service: CurrentStationsService) { }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void{
    this.isLoading = true;
    this.dataSource = new MatTableDataSource<Station>();
    this.service.getStations()
    .subscribe((data: CurrentStations) => {
        this.stations = data.stations;
        this.dataSource = this.tableDataSource(this.stations, this.onlyBlocked);
        this.isLoading = false;
        this.setupSort();
      }
    )
  }

  filterOnlyBlocked(): void{
    this.onlyBlocked = !this.onlyBlocked;
    this.dataSource = this.tableDataSource(this.stations, this.onlyBlocked);
    this.setupSort();
  }

  tableDataSource(stations : Station[], onlyBlocked: boolean): MatTableDataSource<Station>{
    if(!onlyBlocked)
      return new MatTableDataSource(stations);
    
    let lockedStations = stations.filter(station => station.officialStatus != "Ok" || station.state == "Locked");
    return new MatTableDataSource(lockedStations);
  }

  setupSort(): void {
    this.dataSource.sortingDataAccessor = (station, property) => {
          switch(property) {
            case 'lastActivityAgo': return station.lastActivity;
            case 'occupation': return station.occupation;
            default: return station[property];
          }
        };
    this.dataSource.sort = this.sort;
  }
}