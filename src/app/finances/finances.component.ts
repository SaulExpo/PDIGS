import { Component } from '@angular/core';
import { TranslatePipe } from '../i18n/translate.pipe';

@Component({
  selector: 'app-finances',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './finances.component.html',
  styleUrl: './finances.component.css'
})
export class FinancesComponent {}
