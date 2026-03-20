import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { DiaryEntry, Pet } from "../../model/model.interface";
import { Subscription } from "rxjs";
import { PetsService } from "../../services/pets/pets.service";
import { DiaryService } from "../../services/diary/diary.service";

@Component({
  selector: 'app-calendar',
  imports: [FullCalendarModule, TranslatePipe],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private translation = inject(TranslationService);
  private petsService = inject(PetsService);
  private diaryService = inject(DiaryService);

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    events: [],
    dateClick: this.handleDateClick.bind(this),
    eventClick: this.handleEventClick.bind(this)
  };

  diaryEntries: DiaryEntry[] = [];
  pets: Pet[] = [];
  private petsSubscription: Subscription | null = null;
  private diarySubscription: Subscription | null = null;

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.loadPets(user.uid);
        this.loadDiaryEntries(user.uid);
      }
    });
  }

  loadPets(userId: string) {
    if (this.petsSubscription) this.petsSubscription.unsubscribe();

    this.petsSubscription = this.petsService.getPets(userId).subscribe({
      next: (pets) => {
        this.pets = pets;
        this.updateCalendarEvents();
      },
      error: (err) => console.error('Error loading pets:', err)
    });
  }

  loadDiaryEntries(userId: string) {
    if (this.diarySubscription) this.diarySubscription.unsubscribe();

    this.diarySubscription = this.diaryService.getDiaryEntriesByUser(userId).subscribe({
      next: (entries) => {
        this.diaryEntries = entries;
        this.updateCalendarEvents();
      },
      error: (err) => console.error('Error loading entries:', err)
    });
  }

  updateCalendarEvents() {
    const petFallback = this.translation.translate('calendar.petFallback');
    const events = this.diaryEntries.map(entry => {
      const pet = this.pets.find(p => p.id === entry.petId);
      return {
        id: entry.id,
        title: `${pet?.name || petFallback}: ${entry.title}`,
        date: entry.date,
        extendedProps: {
          description: entry.description,
          petName: pet?.name || petFallback
        }
      };
    });

    this.calendarOptions = {...this.calendarOptions, events};
  }

  handleDateClick(arg: any) {
    alert(`${this.translation.translate('calendar.selectedDate')}: ${arg.dateStr}`);
  }

  handleEventClick(arg: any) {
    const event = arg.event;
    alert(`${this.translation.translate('calendar.event')}: ${event.title}\n${this.translation.translate('calendar.description')}: ${event.extendedProps.description}`);
  }

  ngOnDestroy() {
    if (this.petsSubscription) this.petsSubscription.unsubscribe();
    if (this.diarySubscription) this.diarySubscription.unsubscribe();
  }
}
