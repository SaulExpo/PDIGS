import { ChangeDetectorRef, Pipe, PipeTransform } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from './translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private currentValue: string = '';
  private langSub?: Subscription;

  constructor(private translation: TranslationService, private cd: ChangeDetectorRef) {
    this.langSub = this.translation.language$().subscribe(() => {
      // Mark for check when language changes
      this.cd.markForCheck();
    });
  }

  transform(key: string): string {
    return this.translation.translate(key);
  }

  ngOnDestroy() {
    this.langSub?.unsubscribe();
  }
}
