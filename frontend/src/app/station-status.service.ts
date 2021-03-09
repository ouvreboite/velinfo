import { Injectable } from '@angular/core';
import { OfficialStatus, ActivityStatus, Station } from './current-stations.service';
import { StationStateChange } from './state-changes.service';

@Injectable({
  providedIn: 'root'
})
export class StationStatusService {
  constructor() { }

  stationIcon = { url: '/assets/velib_blue_pin.png', anchor: { x: 26, y: 60 }, scaledSize: { width: 52, height: 60 } };
  warningIcon =  { url: '/assets/warning_orange.png', anchor: { x: 26, y: 60 }, scaledSize: { width: 52, height: 60 } };
  koIcon =  { url: '/assets/warning_red.png', anchor: { x: 26, y: 60 }, scaledSize: { width: 52, height: 60 } };

  getStatusMapIcon(station: Station) {
    switch (this.getStatusEmoji(station.officialStatus, station.activityStatus)) {
      case '⛔': return this.koIcon;
      case '⚠️': return this.warningIcon;
      default: return this.stationIcon;
    }
  }

  getStatusEmoji(officialStatus: OfficialStatus, activityStatus: ActivityStatus): string {
    switch (officialStatus) {
      case OfficialStatus.NotInstalled: return '⛔';
      case OfficialStatus.NotRentingNotReturning: return '⛔';
      case OfficialStatus.NotRenting: return '⚠️';
      case OfficialStatus.NotReturning: return '⚠️';
    }

    if (activityStatus == ActivityStatus.Locked)
      return '⚠️';

    return '✅';
  }

  getStatusText(station: Station): string {
    if (station.officialStatus == OfficialStatus.Ok && station.activityStatus == ActivityStatus.Locked)
      return 'Aucune activité récente';

    return this.getOfficialStatusText(station.officialStatus);
  }

  getOfficialStatusText(officialStatus: OfficialStatus): string {
    switch (officialStatus) {
      case OfficialStatus.Ok: return "En fonctionnement";
      case OfficialStatus.NotInstalled: return 'Non installé';
      case OfficialStatus.NotRentingNotReturning: return 'Ni retour ni location';
      case OfficialStatus.NotRenting: return 'Pas de location';
      case OfficialStatus.NotReturning: return 'Pas de retour';
    }
  }

  getStatusChangeText(change: StationStateChange): string{
    const emoji = this.getStatusEmoji(change.newState.officialStatus, change.newState.activityStatus);
    if(change.newState.officialStatus != change.oldState.officialStatus){
      return emoji+"Le status officiel a changé en '"+this.getOfficialStatusText(change.newState.officialStatus)+"'";
    }

    if(change.newState.activityStatus != change.oldState.activityStatus){
      if(change.newState.activityStatus == ActivityStatus.Locked)
        return emoji+"L'activité semble arrêtée";
      else if(change.newState.activityStatus == ActivityStatus.Ok){
        return emoji+"L'activité a repris";
      }
    }
    
    return emoji+"Pas de changement";
  }
}
