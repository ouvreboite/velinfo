import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ActivitiesService, ActivityType } from '../activities.service';
import { CurrentStations, CurrentStationsService, Station } from '../current-stations.service';
import { UserFavoritesService } from '../user-favorites.service';

@Component({
  selector: 'app-favorites-page',
  templateUrl: './favorites-page.component.html',
  styleUrls: ['./favorites-page.component.css']
})
export class FavoritesPageComponent implements OnInit {

  favoriteStations : Station[] = [];
  isLoading = false;
  hasFavorites = false;

  constructor(
    private stationService: CurrentStationsService,
    private userFavoritesServices: UserFavoritesService,
    private activitiesService: ActivitiesService) { }

  ngOnInit(): void {
    var favoriteCodes = this.userFavoritesServices.getUserFavoriteStationsCodes();
    this.hasFavorites = favoriteCodes.length>0;

    if(this.hasFavorites){
      this.isLoading = true;
      forkJoin(
        {
          stations:  this.stationService.getStations(),
          todaysActivities: this.activitiesService.getTotalActivitiesByStation(ActivityType.Actual)
        }
      ).subscribe((observable)=>{
          let stations = observable.stations.stations;
  
          stations.forEach(station =>{
            const todaysActivity = observable.todaysActivities.get(station.code);
            station.todaysActivity = todaysActivity;
          })
          var favoriteCodes = this.userFavoritesServices.getUserFavoriteStationsCodes();
          this.favoriteStations = stations.filter(station => favoriteCodes.includes(station.code));
          this.isLoading = false;
      });
    }
    
  }

}
