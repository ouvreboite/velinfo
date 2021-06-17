import { Component, Input, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Station } from '../current-stations.service';

@Component({
  selector: 'app-stations-table',
  templateUrl: './stations-table.component.html',
  styleUrls: ['./stations-table.component.css']
})
export class StationsTableComponent implements AfterViewInit  {
  @Input() stations: Station[];
  @Input() displayControls = true;
  
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  onlyBlocked = false;
  currentFilterValue = "";
  dataSource = new MatTableDataSource<Station>();
  displayedColumns: string[] = ['name', 'status', 'availability', 'lastActivityAgo'];

  ngAfterViewInit() {
    this.setupTable();
  }

  toggleFilterOnlyBlocked(): void{
    this.onlyBlocked = !this.onlyBlocked;
    this.setupTable();
  }

  applyFilter(event: Event) {
    this.currentFilterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.filter();
  }

  private setupTable(): void{
    var stationsToDisplay = this.filterOnlyBlockedStations(this.stations, this.onlyBlocked);
    this.dataSource = new MatTableDataSource(stationsToDisplay);
    this.setupSort();
    this.filter();
    this.dataSource.paginator = this.paginator;
  }

  private filterOnlyBlockedStations(stations : Station[], onlyBlocked: boolean): Station[]{
    if(!onlyBlocked)
      return stations;
    
    return stations.filter(station => station.officialStatus != "Ok" || station.activityStatus == "Locked");
  }

  private setupSort(): void {
    this.dataSource.sortingDataAccessor = (station, property) => {
          switch(property) {
            case 'lastActivityAgo': return station.lastActivity;
            case 'availability': return station.occupation;
            default: return station[property];
          }
        };
    this.dataSource.sort = this.sort;
  }

  private filter(){
    if(this.currentFilterValue.length>1 && this.currentFilterValue.length<=2)
      return;
    this.dataSource.filter = this.currentFilterValue;
  }

}
