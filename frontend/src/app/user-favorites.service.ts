import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserFavoritesService {
  private localStorageKey = 'velinfo_favorite_stations';
  private favorites: string[];
  constructor() { 
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
    }else{
      this.favorites.push(stationCode);
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
