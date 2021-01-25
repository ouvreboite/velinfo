import { Component, Input, OnInit } from '@angular/core';
import { Station } from '../current-stations.service';
import { UserFavoritesService } from '../user-favorites.service';

@Component({
  selector: 'app-favorite-icon',
  templateUrl: './favorite-icon.component.html',
  styleUrls: ['./favorite-icon.component.css']
})
export class FavoriteIconComponent implements OnInit {
  @Input() station: Station;
  
  favorite = false;
  constructor(
    private userFavoriteService: UserFavoritesService) { }

  ngOnInit(): void {
    this.favorite = this.userFavoriteService.isFavorite(this.station.code);
  }  

  toggleFavorite(){
    this.userFavoriteService.toggleFavorite(this.station.code);
    this.favorite = this.userFavoriteService.isFavorite(this.station.code);
  }

}
