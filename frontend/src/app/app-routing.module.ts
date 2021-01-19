import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FavoritesPageComponent } from './favorites-page/favorites-page.component';
import { HomePageComponent } from './home-page/home-page.component';
import { StationPageComponent } from './station-page/station-page.component';
import { StationsListPageComponent } from './stations-list-page/stations-list-page.component';
import { StationsMapPageComponent } from './stations-map-page/stations-map-page.component';

const routes: Routes = [
  { path: 'map', component: StationsMapPageComponent },
  { path: 'stations', component: StationsListPageComponent },
  { path: 'favorites', component: FavoritesPageComponent },
  { path: 'station/:code', component: StationPageComponent },
  { path: '**', component: HomePageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
