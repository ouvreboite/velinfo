import { Injectable } from '@angular/core';
import { OfficialStatus, State, Station } from './current-stations.service';

@Injectable({
  providedIn: 'root'
})
export class StationStatusService {
  constructor() { }

  stationIcon = { url: '/assets/velib_blue_pin.png', anchor: { x: 26, y: 60 }, scaledSize: { width: 52, height: 60 } };
  warningIcon =  { url: '/assets/warning_orange.png', anchor: { x: 26, y: 60 }, scaledSize: { width: 52, height: 60 } };
  koIcon =  { url: '/assets/warning_red.png', anchor: { x: 26, y: 60 }, scaledSize: { width: 52, height: 60 } };

  getStatusMapIcon(station: Station) {
    switch (this.getStatusEmoji(station)) {
      case '⛔': return this.koIcon;
      case '⚠️': return this.warningIcon;
      default: return this.stationIcon;
    }
  }

  getStatusEmoji(station: Station): string {
    switch (station.officialStatus) {
      case OfficialStatus.NotInstalled: return '⛔';
      case OfficialStatus.NotRentingNotReturning: return '⛔';
      case OfficialStatus.NotRenting: return '⚠️';
      case OfficialStatus.NotReturning: return '⚠️';
    }

    if (station.state == State.Locked)
      return '⚠️';

    return '✅';
  }

  getStatusText(station: Station): string {
    switch (station.officialStatus) {
      case OfficialStatus.NotInstalled: return 'Non installé';
      case OfficialStatus.NotRentingNotReturning: return 'Ni retour ni location';
      case OfficialStatus.NotRenting: return 'Pas de location';
      case OfficialStatus.NotReturning: return 'Pas de retour';
    }

    if (station.state == State.Locked)
      return 'Aucune activité récente';

    return 'Ok';
  }
}
