import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class UserFavoritesService {
  private localStorageKey = 'velinfo_favorite_stations';
  private favorites: string[];
  constructor(private _snackBar: MatSnackBar) { 
    this.favorites = this.getFromLocalStorage();
  }

  isFavorite(stationCode: string): boolean{
    return this.favorites.includes(stationCode);
  }
  getUserFavoriteStationsCodes(): string[]{
    return this.favorites;
  }

  toggleFavorite(stationCode: string){
    var index = this.favorites.indexOf(stationCode);
    if (index !== -1) {
      this.favorites.splice(index, 1);
      this._snackBar.open("La station a été retirée des favoris", "D'accord", {
        duration: 2000,
      });
    }else{
      this.favorites.push(stationCode);
      this._snackBar.open("La station a été ajouté aux favoris", "D'accord", {
        duration: 2000,
      });
    }
    this.setToLocalStorage(this.favorites);
  }
  
  private getFromLocalStorage(): string[]{
    if(!localStorage.getItem(this.localStorageKey))
      return [];
    return JSON.parse(localStorage.getItem(this.localStorageKey));
  }

  private setToLocalStorage(codes: string[]){
    localStorage.setItem(this.localStorageKey, JSON.stringify(codes));
  }
}
