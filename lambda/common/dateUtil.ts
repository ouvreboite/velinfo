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
    return toParisTZ(date).toISOString().substring(0,10)
}

export function toParisTZ(date: Date): Date{
    return utcToZonedTime(date, "Europe/Paris");
}

export function buildTimeSlot(datetime: Date, minuteSpan = 5): string{
    let parisTz = toParisTZ(datetime);
    let minutesSlot = Math.floor(parisTz.getMinutes()/minuteSpan)*minuteSpan;
    let formattedMinutesSlot = minutesSlot.toLocaleString('fr-FR', {
        minimumIntegerDigits: 2,
        useGrouping: false
    });
    let formattedHoursSlot = parisTz.getHours().toLocaleString('fr-FR', {
        minimumIntegerDigits: 2,
        useGrouping: false
    });
    return formattedHoursSlot+":"+formattedMinutesSlot;
}

