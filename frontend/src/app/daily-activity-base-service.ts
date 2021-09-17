import { HttpClient } from '@angular/common/http';
import { differenceInSeconds } from 'date-fns';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

export abstract class DailyActivityBaseService {
    abstract getUrl(): string;
    private loadTimestamp: Date;
    private networkActivity: DailyActivity;
    private observable: Observable<DailyActivity>;

    constructor(private http: HttpClient) {
    }

    getDailyActivity(): Observable<DailyActivity> {
        this.invalidCacheIfNecessary()

        if (this.networkActivity) {
            return of(this.networkActivity);
        } else if (this.observable) {
            return this.observable;
        } else {
            this.observable = this.fetchNetworkActivity()
                .pipe(
                    map(networkActivity => {
                        networkActivity.hourlySortedActivity = this.toHourlySortedActivity(networkActivity);
                        networkActivity.sortedActivity = this.toSortedActivity(networkActivity);
                        this.observable = null;
                        this.networkActivity = networkActivity;
                        return networkActivity;
                    }));
            return this.observable;
        }
    }

    private fetchNetworkActivity(): Observable<DailyActivity> {
        this.loadTimestamp = new Date();
        return this.http.get<DailyActivity>(this.getUrl());
    }

    private invalidCacheIfNecessary() {
        if (!this.loadTimestamp || differenceInSeconds(new Date(), this.loadTimestamp) > 60) {
            this.loadTimestamp = null;
            this.networkActivity = null;
            this.observable = null;
        }
    }

    private toHourlySortedActivity(networkActivity: DailyActivity): Activity[] {
        let hourlyMap = new Map<string, number>();
        Array.from(Object.entries(networkActivity.byTimeSlot))
            .forEach(([timeslot, activity]) => {
                let hour = timeslot.split(':')[0];
                let hourActivity = hourlyMap.get(hour) ?? 0;
                hourActivity += activity.activity;
                hourlyMap.set(hour, hourActivity);
            });

        return Array.from(hourlyMap.entries())
            .sort(([slotA, activityA], [slotB, activityB]) => slotA.localeCompare(slotB))
            .map(([hour, activity]) => {
                return { timeslot: hour, activity: activity } as Activity;
            })
    }

    private toSortedActivity(networkActivity: DailyActivity): Activity[] {
        return Object.entries(networkActivity.byTimeSlot)
            .sort(([slotA, activityA], [slotB, activityB]) => slotA.localeCompare(slotB))
            .map(([slot, activity]) => {
                return { timeslot: slot, activity: activity.activity } as Activity;
            })
    }

}

export class DailyActivity {
    byTimeSlot: Map<string, Activity>;
    hourlySortedActivity?: Activity[];
    sortedActivity?: Activity[];
    totalActivity: number;
}

export class Activity {
    timeslot: string;
    activity: number;
}