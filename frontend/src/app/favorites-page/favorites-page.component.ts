import { Component, OnInit } from '@angular/core';
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
    private currentStationsService: CurrentStationsService,
    private userFavoritesServices: UserFavoritesService) { }

  ngOnInit(): void {
    var favoriteCodes = this.userFavoritesServices.getUserFavoriteStationsCodes();
    this.hasFavorites = favoriteCodes.length>0;

    if(this.hasFavorites){
      this.isLoading = true;
      this.currentStationsService.getStations()
      .subscribe((data: CurrentStations) => {
          var favoriteCodes = this.userFavoritesServices.getUserFavoriteStationsCodes();
          this.favoriteStations = data.stations.filter(station => favoriteCodes.includes(station.code));
          this.isLoading = false;
        }
      )
    }
    
  }

}
