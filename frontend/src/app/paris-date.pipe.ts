import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'parisDate'
})
export class ParisDatePipe implements PipeTransform {
  transform(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZone: 'Europe/Paris' });
  }
}
