import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { CurrentStations, CurrentStationsService, Station } from '../current-stations.service';

@Component({
  selector: 'app-stations-list-page',
  templateUrl: './stations-list-page.component.html',
  styleUrls: ['./stations-list-page.component.css']
})
export class StationsListPageComponent implements OnInit {
  isLoading = true;
  onlyBlocked = false;
  numberOfStations = 0;
  dataSource = new MatTableDataSource<Station>();
  displayedColumns: string[] = ['name', 'status', 'occupation', 'lastActivityAgo'];

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
        this.setupTable();
      }
    )
  }

  filterOnlyBlocked(): void{
    this.onlyBlocked = !this.onlyBlocked;
    this.setupTable();
  }

  setupTable(): void{
    var stationsToDisplay = this.stationsToDisplay(this.stations, this.onlyBlocked);
    this.dataSource = new MatTableDataSource(stationsToDisplay);
    this.numberOfStations = stationsToDisplay.length;
    this.isLoading = false;
    this.setupSort();
  }

  stationsToDisplay(stations : Station[], onlyBlocked: boolean): Station[]{
    if(!onlyBlocked)
      return stations;
    
    return stations.filter(station => station.officialStatus != "Ok" || station.state == "Locked");
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

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    if(filterValue.length>1 && filterValue.length<=2)
      return;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}