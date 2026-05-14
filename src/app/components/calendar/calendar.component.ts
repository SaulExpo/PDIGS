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
import { ReminderNotificationsService } from '../../services/reminder-notifications/reminder-notifications.service';

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
  private reminderNotifications = inject(ReminderNotificationsService);

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
  isEditingEvent = false;
  editingEventId: string | null = null;
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
    hasReminder: boolean;
    reminderDate: string;
    reminderTime: string;
    reminderMessage: string;
    petPhotoUrl: string;
    entryPhotoUrl: string;
  } | null = null;

  successMessage = '';
  errorMessage = '';

  eventForm = new FormGroup({
    title: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
    date: new FormControl('', Validators.required),
    time: new FormControl('', Validators.required),
    petId: new FormControl('', Validators.required),
    hasReminder: new FormControl(false, { nonNullable: true }),
    reminderDate: new FormControl(''),
    reminderTime: new FormControl(''),
    reminderMessage: new FormControl('')
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
          petPhotoUrl: pet?.mainPhotoUrl || '',
          entryPhotoUrl: entry.mainPhotoUrl || '',
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
          petPhotoUrl: pet?.mainPhotoUrl || '',
          entryPhotoUrl: '',
          time: event.time,
          source: 'custom',
          hasReminder: !!event.hasReminder,
          reminderDate: event.reminderDate || '',
          reminderTime: event.reminderTime || '',
          reminderMessage: event.reminderMessage || ''
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
    this.isEditingEvent = false;
    this.editingEventId = null;
    this.eventForm.patchValue({
      date: selectedDate || new Date().toISOString().split('T')[0],
      time: '09:00',
      petId: this.pets.length ? this.pets[0].id : '',
      hasReminder: false,
      reminderDate: '',
      reminderTime: '',
      reminderMessage: ''
    });
    this.showEventForm = true;
  }

  cancelEventForm() {
    this.showEventForm = false;
    this.isEditingEvent = false;
    this.editingEventId = null;
    this.eventForm.reset();
  }

  selectEventPet(petId: string) {
    this.eventForm.patchValue({ petId });
    this.eventForm.get('petId')?.markAsTouched();
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
    const hasReminder = !!formValue.hasReminder;

    if (hasReminder) {
      const permission = await this.reminderNotifications.ensurePermission();

      if (permission === 'denied') {
        await this.alertService.validation(
          'El navegador tiene bloqueadas las notificaciones. Activalas para que el recordatorio avise a la hora indicada.',
          'Browser notifications are blocked. Enable them so the reminder can alert you at the scheduled time.'
        );
      }

      if (permission === 'unsupported') {
        await this.alertService.validation(
          'Este navegador no soporta notificaciones del sistema. El recordatorio se guardara, pero no podra avisarte automaticamente.',
          'This browser does not support system notifications. The reminder will be saved, but it will not alert you automatically.'
        );
      }
    }

    if (hasReminder && (!formValue.reminderDate || !formValue.reminderTime)) {
      await this.alertService.validation(
        'Completa la fecha y la hora del recordatorio.',
        'Please fill in the reminder date and time.'
      );
      return;
    }

    if (
      hasReminder &&
      !this.isReminderScheduledBeforeEvent(
        formValue.date!,
        formValue.time!,
        formValue.reminderDate!,
        formValue.reminderTime!
      )
    ) {
      await this.alertService.validation(
        'El recordatorio debe programarse antes o a la misma hora que el evento.',
        'The reminder must be scheduled before or at the same time as the event.'
      );
      return;
    }

    const eventData = {
      title: formValue.title!,
      description: formValue.description!,
      date: formValue.date!,
      time: formValue.time!,
      petId: formValue.petId!,
      userId: this.currentUserId,
      hasReminder,
      reminderDate: hasReminder ? formValue.reminderDate! : '',
      reminderTime: hasReminder ? formValue.reminderTime! : '',
      reminderMessage: hasReminder ? (formValue.reminderMessage || '').trim() : ''
    };

    try {
      this.isSavingEvent = true;
      if (this.isEditingEvent && this.editingEventId) {
        await this.calendarEventsService.updateCalendarEvent(this.editingEventId, eventData);

        this.customEvents = this.customEvents.map(event =>
          event.id === this.editingEventId
            ? {
                ...event,
                ...eventData
              }
            : event
        );

        if (this.selectedEventDetails?.id === this.editingEventId) {
          const petName = this.pets.find(pet => pet.id === eventData.petId)?.name
            || this.translation.translate('calendar.petFallback');
          const petPhotoUrl = this.pets.find(pet => pet.id === eventData.petId)?.mainPhotoUrl || '';

          this.selectedEventDetails = {
            ...this.selectedEventDetails,
            title: eventData.title,
            description: eventData.description,
            date: eventData.date,
            time: eventData.time,
            petName,
            petPhotoUrl,
            hasReminder: eventData.hasReminder,
            reminderDate: eventData.reminderDate,
            reminderTime: eventData.reminderTime,
            reminderMessage: eventData.reminderMessage
          };
        }

        await this.alertService.success('update', this.getEntityLabel());
      } else {
        const newId = await this.calendarEventsService.addCalendarEvent(eventData);

        this.customEvents = [
          ...this.customEvents,
          {
            id: newId,
            ...eventData
          }
        ];

        await this.alertService.success('create', this.getEntityLabel());
      }

      this.updateCalendarEvents();
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
      time: event.extendedProps['time'] || '',
      hasReminder: !!event.extendedProps['hasReminder'],
      reminderDate: event.extendedProps['reminderDate'] || '',
      reminderTime: event.extendedProps['reminderTime'] || '',
      reminderMessage: event.extendedProps['reminderMessage'] || '',
      petPhotoUrl: event.extendedProps['petPhotoUrl'] || '',
      entryPhotoUrl: event.extendedProps['entryPhotoUrl'] || ''
    };

    this.showModal = true;
    setTimeout(() => {
      this.modalVisible = true;
    }, 10);
  }

  openEditReminderForm() {
    if (!this.selectedEventDetails || this.selectedEventDetails.source !== 'custom') {
      return;
    }

    const eventToEdit = this.customEvents.find(event => event.id === this.selectedEventDetails?.id);
    if (!eventToEdit) {
      return;
    }

    this.eventForm.reset();
    this.eventForm.patchValue({
      title: eventToEdit.title,
      description: eventToEdit.description,
      date: eventToEdit.date,
      time: eventToEdit.time,
      petId: eventToEdit.petId,
      hasReminder: !!eventToEdit.hasReminder,
      reminderDate: eventToEdit.reminderDate || '',
      reminderTime: eventToEdit.reminderTime || '',
      reminderMessage: eventToEdit.reminderMessage || ''
    });

    this.isEditingEvent = true;
    this.editingEventId = eventToEdit.id;
    this.showEventForm = true;
    this.closeModal();
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

  async deleteSelectedReminder() {
    if (!this.selectedEventDetails) return;

    if (this.selectedEventDetails.source !== 'custom' || !this.selectedEventDetails.hasReminder) {
      await this.alertService.validation(
        'Solo se pueden eliminar recordatorios de eventos personalizados.',
        'Only reminders from custom events can be deleted.'
      );
      return;
    }

    const confirmed = await this.alertService.confirmDelete(this.getReminderEntityLabel());
    if (!confirmed) return;

    try {
      const eventId = this.selectedEventDetails.id;
      const reminderUpdate = {
        hasReminder: false,
        reminderDate: '',
        reminderTime: '',
        reminderMessage: ''
      };

      await this.calendarEventsService.updateCalendarEvent(eventId, reminderUpdate);

      this.customEvents = this.customEvents.map(event =>
        event.id === eventId
          ? {
              ...event,
              ...reminderUpdate
            }
          : event
      );

      this.selectedEventDetails = {
        ...this.selectedEventDetails,
        ...reminderUpdate
      };

      this.updateCalendarEvents();
      await this.alertService.success('delete', this.getReminderEntityLabel());
    } catch (error) {
      console.error('Error deleting reminder:', error);
      await this.alertService.error('delete', this.getReminderEntityLabel());
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

  private getReminderEntityLabel() {
    return this.translation.getLanguage() === 'en' ? 'reminder' : 'recordatorio';
  }

  private isReminderScheduledBeforeEvent(
    eventDate: string,
    eventTime: string,
    reminderDate: string,
    reminderTime: string
  ) {
    const eventDateTime = new Date(`${eventDate}T${eventTime}`);
    const reminderDateTime = new Date(`${reminderDate}T${reminderTime}`);

    return reminderDateTime.getTime() <= eventDateTime.getTime();
  }
}
