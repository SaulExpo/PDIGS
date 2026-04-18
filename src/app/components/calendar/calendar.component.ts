import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { CalendarEventEntry, DiaryEntry, Pet } from '../../model/model.interface';
import { Subscription } from 'rxjs';
import { PetsService } from '../../services/pets/pets.service';
import { DiaryService } from '../../services/diary/diary.service';
import { CalendarEventsService } from '../../services/calendar-events/calendar-events.service';
import { AlertService } from '../../services/alert/alert.service';

@Component({
  selector: 'app-calendar',
  imports: [CommonModule, FullCalendarModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private translation = inject(TranslationService);
  private petsService = inject(PetsService);
  private diaryService = inject(DiaryService);
  private calendarEventsService = inject(CalendarEventsService);
  private alertService = inject(AlertService);

  currentUserId = '';

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    events: [],
    dateClick: this.handleDateClick.bind(this),
    eventClick: this.handleEventClick.bind(this)
  };

  diaryEntries: DiaryEntry[] = [];
  customEvents: CalendarEventEntry[] = [];
  pets: Pet[] = [];

  showEventForm = false;
  isSavingEvent = false;
  showModal = false;
  modalVisible = false;
  selectedEventDetails: {
    id: string;
    source: 'diary' | 'custom';
    title: string;
    description: string;
    petName: string;
    date: string;
    time: string;
  } | null = null;

  successMessage = '';
  errorMessage = '';

  eventForm = new FormGroup({
    title: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
    date: new FormControl('', Validators.required),
    time: new FormControl('', Validators.required),
    petId: new FormControl('', Validators.required)
  });

  private petsSubscription: Subscription | null = null;
  private diarySubscription: Subscription | null = null;
  private customEventsSubscription: Subscription | null = null;

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.currentUserId = user.uid;
        this.loadPets(user.uid);
        this.loadDiaryEntries(user.uid);
        this.loadCustomEvents(user.uid);
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

  loadCustomEvents(userId: string) {
    if (this.customEventsSubscription) this.customEventsSubscription.unsubscribe();

    this.customEventsSubscription = this.calendarEventsService.getCalendarEventsByUser(userId).subscribe({
      next: (events) => {
        this.customEvents = events;
        this.updateCalendarEvents();
      },
      error: (err) => console.error('Error loading custom calendar events:', err)
    });
  }

  updateCalendarEvents() {
    const petFallback = this.translation.translate('calendar.petFallback');

    const diaryEvents = this.diaryEntries.map(entry => {
      const pet = this.pets.find(p => p.id === entry.petId);

      return {
        id: `diary-${entry.id}`,
        title: `${pet?.name || petFallback}: ${entry.title}`,
        date: entry.date,
        allDay: true,
        extendedProps: {
          description: entry.description,
          petName: pet?.name || petFallback,
          time: '',
          source: 'diary'
        }
      };
    });

    const customEvents = this.customEvents.map(event => {
      const pet = this.pets.find(p => p.id === event.petId);

      return {
        id: `custom-${event.id}`,
        start: `${event.date}T${event.time}`,
        title: event.title,
        allDay: false,
        extendedProps: {
          description: event.description,
          petName: pet?.name || petFallback,
          time: event.time,
          source: 'custom'
        }
      };
    });

    this.calendarOptions = {
      ...this.calendarOptions,
      events: [...diaryEvents, ...customEvents]
    };
  }

  clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }

  openCreateEventForm(selectedDate?: string) {
    this.clearMessages();
    this.eventForm.reset();
    this.eventForm.patchValue({
      date: selectedDate || new Date().toISOString().split('T')[0],
      time: '09:00',
      petId: this.pets.length ? this.pets[0].id : ''
    });
    this.showEventForm = true;
  }

  cancelEventForm() {
    this.showEventForm = false;
    this.eventForm.reset();
  }

  handleDateClick(arg: DateClickArg) {
    this.openCreateEventForm(arg.dateStr);
  }

  async saveCustomEvent() {
    this.clearMessages();

    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      await this.alertService.validation(
        'Completa correctamente todos los campos del evento.',
        'Please fill in all event fields correctly.'
      );
      return;
    }

    if (!this.currentUserId) {
      await this.alertService.validation(
        'No se ha encontrado la sesion del usuario.',
        'User session not found.'
      );
      return;
    }

    const formValue = this.eventForm.value;

    const eventData = {
      title: formValue.title!,
      description: formValue.description!,
      date: formValue.date!,
      time: formValue.time!,
      petId: formValue.petId!,
      userId: this.currentUserId
    };

    try {
      this.isSavingEvent = true;
      const newId = await this.calendarEventsService.addCalendarEvent(eventData);

      this.customEvents = [
        ...this.customEvents,
        {
          id: newId,
          ...eventData
        }
      ];
      this.updateCalendarEvents();

      await this.alertService.success('create', this.getEntityLabel());
      this.cancelEventForm();
    } catch (error) {
      console.error('Error saving calendar event:', error);
      await this.alertService.error('save', this.getEntityLabel());
    } finally {
      this.isSavingEvent = false;
    }
  }

  handleEventClick(arg: EventClickArg) {
    const event = arg.event;
    const rawId = event.id.startsWith('custom-')
      ? event.id.replace('custom-', '')
      : event.id.replace('diary-', '');

    this.selectedEventDetails = {
      id: rawId,
      source: event.extendedProps['source'] || 'diary',
      title: event.title,
      description: event.extendedProps['description'] || '',
      petName: event.extendedProps['petName'] || this.translation.translate('calendar.petFallback'),
      date: event.start
        ? event.start.toISOString().split('T')[0]
        : '',
      time: event.extendedProps['time'] || ''
    };

    this.showModal = true;
    setTimeout(() => {
      this.modalVisible = true;
    }, 10);
  }

  async deleteSelectedEvent() {
    if (!this.selectedEventDetails) return;

    if (this.selectedEventDetails.source !== 'custom') {
      await this.alertService.validation(
        'Solo se pueden eliminar los eventos personalizados.',
        'Only custom events can be deleted.'
      );
      return;
    }

    const confirmed = await this.alertService.confirmDelete(this.getEntityLabel());
    if (!confirmed) return;

    try {
      const eventId = this.selectedEventDetails.id;

      await this.calendarEventsService.deleteCalendarEvent(eventId);

      this.customEvents = this.customEvents.filter(event => event.id !== eventId);
      this.updateCalendarEvents();

      this.closeModal();
      this.clearMessages();
      await this.alertService.success('delete', this.getEntityLabel());
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      this.clearMessages();
      await this.alertService.error('delete', this.getEntityLabel());
    }
  }

  closeModal() {
    this.modalVisible = false;
    setTimeout(() => {
      this.showModal = false;
      this.selectedEventDetails = null;
    }, 300);
  }

  ngOnDestroy() {
    if (this.petsSubscription) this.petsSubscription.unsubscribe();
    if (this.diarySubscription) this.diarySubscription.unsubscribe();
    if (this.customEventsSubscription) this.customEventsSubscription.unsubscribe();
  }

  private getEntityLabel() {
    return this.translation.getLanguage() === 'en' ? 'event' : 'evento';
  }
}
