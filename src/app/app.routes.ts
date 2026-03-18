import { Routes } from '@angular/router';
import { CalendarComponent } from './calendar/calendar.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DiaryComponent } from './diary/diary.component';
import { DietsComponent } from './diets/diets.component';
import { FinancesComponent } from './finances/finances.component';
import { LoginComponent } from './login/login.component';
import { MapComponent } from './map/map.component';
import { MedicalRecordsComponent } from './medical-records/medical-records.component';
import { PetsComponent } from './pets/pets.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      { path: '', redirectTo: 'pets', pathMatch: 'full' },
      { path: 'pets', component: PetsComponent },
      { path: 'diets', component: DietsComponent },
      { path: 'diary', component: DiaryComponent },
      { path: 'medical-records', component: MedicalRecordsComponent },
      { path: 'calendar', component: CalendarComponent },
      { path: 'map', component: MapComponent },
      { path: 'finances', component: FinancesComponent },
    ]
  },
];