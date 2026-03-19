import { Component, OnInit, inject } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, collection, onSnapshot, query, where } from '@angular/fire/firestore';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { TranslatePipe } from '../i18n/translate.pipe';
import { TranslationService } from '../i18n/translation.service';

interface DiaryEntry {
  id: string;
  petId: string;
  date: string;
  title: string;
  description: string;
  userId: string;
}

interface Pet {
  id: string;
  name: string;
  type: string;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FullCalendarModule, TranslatePipe],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent implements OnInit {
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    events: [],
    dateClick: this.handleDateClick.bind(this),
    eventClick: this.handleEventClick.bind(this)
  };

  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private translation = inject(TranslationService);
  diaryEntries: DiaryEntry[] = [];
  pets: Pet[] = [];

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.loadPets(user.uid);
        this.loadDiaryEntries(user.uid);
      }
    });
  }

  loadPets(userId: string) {
    const petsRef = collection(this.firestore, 'pets');
    const q = query(petsRef, where('userId', '==', userId));
    onSnapshot(q, (querySnapshot) => {
      this.pets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Pet));
      this.updateCalendarEvents();
    });
  }

  loadDiaryEntries(userId: string) {
    const diaryRef = collection(this.firestore, 'diary');
    const q = query(diaryRef, where('userId', '==', userId));
    onSnapshot(q, (querySnapshot) => {
      this.diaryEntries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DiaryEntry));
      this.updateCalendarEvents();
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

    this.calendarOptions = { ...this.calendarOptions, events };
  }

  handleDateClick(arg: any) {
    alert(`${this.translation.translate('calendar.selectedDate')}: ${arg.dateStr}`);
  }

  handleEventClick(arg: any) {
    const event = arg.event;
    alert(`${this.translation.translate('calendar.event')}: ${event.title}\n${this.translation.translate('calendar.description')}: ${event.extendedProps.description}`);
  }
}
