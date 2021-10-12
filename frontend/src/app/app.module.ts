import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatChipsModule} from '@angular/material/chips';
import {MatInputModule} from '@angular/material/input';
import { AgmCoreModule } from '@agm/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StationsListPageComponent } from './stations-list-page/stations-list-page.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StationAvailabilityBarComponent } from './station-availability-bar/station-availability-bar.component';
import { StationStatusComponent } from './station-status/station-status.component';
import { StationPageComponent } from './station-page/station-page.component';
import { StationsMapPageComponent } from './stations-map-page/stations-map-page.component';
import { UserFavoritesService } from './user-favorites.service';
import { StationStatusService } from './station-status.service';
import { CurrentStationsService } from './current-stations.service';
import { FavoriteIconComponent } from './favorite-icon/favorite-icon.component';
import { FavoritesPageComponent } from './favorites-page/favorites-page.component';
import { StationsTableComponent } from './stations-table/stations-table.component';

@NgModule({
  declarations: [
    AppComponent,
    StationsListPageComponent,
    StationsMapPageComponent,
    StationAvailabilityBarComponent,
    StationStatusComponent,
    StationPageComponent,
    FavoriteIconComponent,
    FavoritesPageComponent,
    StationsTableComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatInputModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyBv75Y2c54tz4EpNUovz1B2xE4QzoiBWNo'
    })
  ],
  providers: [UserFavoritesService, StationStatusService, CurrentStationsService],
  bootstrap: [AppComponent]
})
export class AppModule { }
