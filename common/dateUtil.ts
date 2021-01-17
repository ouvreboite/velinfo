import utcToZonedTime from "date-fns-tz/utcToZonedTime";

export function stripToHour(date: Date): Date {
    let hour = new Date(date.getTime())
    hour.setMilliseconds(0);
    hour.setMinutes(0);
    hour.setSeconds(0);
    return hour;
}

export function deltaSeconds(date1: Date, date2: Date): number{
    let diff = date1.getTime() - date2.getTime();
    let seconds = diff / 1000;
    return Math.abs(seconds);
}

export function deltaMinutes(date1: Date, date2: Date): number{
    return deltaSeconds(date1, date2)/60;
}

export function toParisDay(date: Date): string{
    var parisDate = utcToZonedTime(date, "Europe/Paris");
    return parisDate.toISOString().substring(0,10)
}

export function toParisHour(date: Date): number{
    var parisDate = utcToZonedTime(date, "Europe/Paris");
    return parisDate.getHours();
}

