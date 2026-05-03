import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  onSnapshot,
  query,
  updateDoc,
  where
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { CalendarEventEntry } from '../../model/model.interface';

@Injectable({
  providedIn: 'root',
})
export class CalendarEventsService {
  private firestore = inject(Firestore);

  getCalendarEventsByUser(userId: string): Observable<CalendarEventEntry[]> {
    return new Observable<CalendarEventEntry[]>((observer) => {
      const eventsRef = collection(this.firestore, 'calendar_events');
      const q = query(eventsRef, where('userId', '==', userId));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const events = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          } as CalendarEventEntry))
          .sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`).getTime();
            const dateB = new Date(`${b.date}T${b.time}`).getTime();
            return dateA - dateB;
          });

        observer.next(events);
      }, (error) => observer.error(error));

      return { unsubscribe };
    });
  }

  async addCalendarEvent(eventData: Omit<CalendarEventEntry, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, 'calendar_events'), eventData);
    return docRef.id;
  }

  async updateCalendarEvent(eventId: string, eventData: Partial<CalendarEventEntry>): Promise<void> {
    const docReference = doc(this.firestore, 'calendar_events', eventId);
    await updateDoc(docReference, eventData);
  }

  async deleteCalendarEvent(eventId: string): Promise<void> {
    const docReference = doc(this.firestore, 'calendar_events', eventId);
    await deleteDoc(docReference);
  }
}
