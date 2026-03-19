import { Component } from '@angular/core';
import { TranslatePipe } from '../i18n/translate.pipe';

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './medical-records.component.html',
  styleUrl: './medical-records.component.css'
})
export class MedicalRecordsComponent {}
