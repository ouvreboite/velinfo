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