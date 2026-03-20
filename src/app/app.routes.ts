import { Routes } from '@angular/router';
import { CalendarComponent } from './components/calendar/calendar.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DiaryComponent } from './components/diary/diary.component';
import { DietsComponent } from './components/diets/diets.component';
import { FinancesComponent } from './components/finances/finances.component';
import { LoginComponent } from './components/login/login.component';
import { MapComponent } from './components/map/map.component';
import { MedicalRecordsComponent } from './components/medical-records/medical-records.component';
import { PetsComponent } from './components/pets/pets.component';

export const routes: Routes = [
  {path: '', redirectTo: '/login', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      {path: '', redirectTo: 'pets', pathMatch: 'full'},
      {path: 'pets', component: PetsComponent},
      {path: 'diets', component: DietsComponent},
      {path: 'diary', component: DiaryComponent},
      {path: 'medical-records', component: MedicalRecordsComponent},
      {path: 'calendar', component: CalendarComponent},
      {path: 'map', component: MapComponent},
      {path: 'finances', component: FinancesComponent},
    ]
  },
];
