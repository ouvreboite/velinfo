import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StationPageComponent } from './station-page/station-page.component';
import { StationTableComponent } from './station-table/station-table.component';

const routes: Routes = [
  { path: 'table', component: StationTableComponent },
  { path: 'station/:code', component: StationPageComponent },
  { path: '**', redirectTo: '/table' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
