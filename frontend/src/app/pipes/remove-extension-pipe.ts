import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'removeExtension',
  standalone: true,
})
export class RemoveExtensionPipe implements PipeTransform {
  transform(value: string): string {
    if (!value || typeof value !== 'string') {
      return value;
    }
    // This finds and removes the last occurrence of .pdf, case-insensitively
    return value.replace(/\.pdf$/i, '');
  }
}