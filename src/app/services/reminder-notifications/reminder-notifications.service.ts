import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { CalendarEventEntry } from '../../model/model.interface';
import { CalendarEventsService } from '../calendar-events/calendar-events.service';
import { TranslationService } from '../../i18n/translation.service';

const POLL_INTERVAL_MS = 30000;
const STORAGE_KEY = 'pdigs_notified_reminders';

@Injectable({
  providedIn: 'root'
})
export class ReminderNotificationsService implements OnDestroy {
  private calendarEventsService = inject(CalendarEventsService);
  private translation = inject(TranslationService);

  private remindersSubscription: Subscription | null = null;
  private reminderTimer: ReturnType<typeof setInterval> | null = null;
  private trackedEvents: CalendarEventEntry[] = [];
  private activeUserId: string | null = null;
  private notifiedReminderKeys = new Set<string>(this.loadNotifiedReminderKeys());

  constructor(@Inject(DOCUMENT) private document: Document) {}

  start(userId: string) {
    if (!userId) {
      return;
    }

    if (this.activeUserId === userId && this.remindersSubscription && this.reminderTimer) {
      return;
    }

    this.stop();
    this.activeUserId = userId;

    this.remindersSubscription = this.calendarEventsService.getCalendarEventsByUser(userId).subscribe({
      next: (events) => {
        this.trackedEvents = events.filter(event => !!event.hasReminder);
        this.flushDueReminders();
      },
      error: (error) => console.error('Error loading reminders for notifications:', error)
    });

    this.reminderTimer = setInterval(() => {
      this.flushDueReminders();
    }, POLL_INTERVAL_MS);
  }

  stop() {
    this.remindersSubscription?.unsubscribe();
    this.remindersSubscription = null;

    if (this.reminderTimer) {
      clearInterval(this.reminderTimer);
      this.reminderTimer = null;
    }

    this.trackedEvents = [];
    this.activeUserId = null;
  }

  async ensurePermission() {
    if (typeof Notification === 'undefined') {
      return 'unsupported' as const;
    }

    if (Notification.permission === 'granted') {
      return 'granted' as const;
    }

    if (Notification.permission === 'denied') {
      return 'denied' as const;
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  ngOnDestroy() {
    this.stop();
  }

  private flushDueReminders() {
    const now = new Date();

    for (const event of this.trackedEvents) {
      if (!event.reminderDate || !event.reminderTime) {
        continue;
      }

      const reminderDateTime = new Date(`${event.reminderDate}T${event.reminderTime}`);
      const reminderKey = this.getReminderKey(event);

      if (Number.isNaN(reminderDateTime.getTime()) || this.notifiedReminderKeys.has(reminderKey)) {
        continue;
      }

      if (reminderDateTime.getTime() <= now.getTime()) {
        this.notifyReminder(event);
        this.notifiedReminderKeys.add(reminderKey);
        this.persistNotifiedReminderKeys();
      }
    }
  }

  private notifyReminder(event: CalendarEventEntry) {
    const canUseSystemNotification =
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted' &&
      this.document.hidden;

    if (canUseSystemNotification) {
      this.showSystemNotification(event);
      return;
    }

    this.showInAppNotification(event);
  }

  private showSystemNotification(event: CalendarEventEntry) {
    const title = this.translation.getLanguage() === 'en'
      ? `Reminder: ${event.title}`
      : `Recordatorio: ${event.title}`;

    const bodyParts = [
      event.reminderMessage?.trim() || event.description?.trim() || '',
      `${event.date} ${event.time}`.trim()
    ].filter(Boolean);

    const notification = new Notification(title, {
      body: bodyParts.join(' · '),
      tag: this.getReminderKey(event)
    });

    notification.onclick = () => {
      window.focus();
      this.document.defaultView?.focus();
    };
  }

  private showInAppNotification(event: CalendarEventEntry) {
    const isEnglish = this.translation.getLanguage() === 'en';
    const title = isEnglish ? 'Reminder due' : 'Recordatorio pendiente';
    const textParts = [
      event.title,
      event.reminderMessage?.trim() || event.description?.trim() || '',
      `${event.date} ${event.time}`.trim()
    ].filter(Boolean);

    void Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title,
      text: textParts.join(' · '),
      showConfirmButton: false,
      timer: 6000,
      timerProgressBar: true
    });
  }

  private getReminderKey(event: CalendarEventEntry) {
    return `${event.id}|${event.reminderDate}|${event.reminderTime}`;
  }

  private loadNotifiedReminderKeys() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(value => typeof value === 'string') : [];
    } catch {
      return [];
    }
  }

  private persistNotifiedReminderKeys() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.notifiedReminderKeys)));
  }
}
