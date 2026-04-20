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
} from "@angular/fire/firestore";
import { Observable } from 'rxjs';
import { DiaryEntry } from "../../model/model.interface";
import { Auth } from "@angular/fire/auth";

@Injectable({
  providedIn: 'root',
})
export class DiaryService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  getDiaryEntries(petId: string): Observable<DiaryEntry[]> {
    return new Observable<DiaryEntry[]>((observer) => {
      const diaryRef = collection(this.firestore, 'diary');
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        observer.error(Error('User not authenticated'));
        return;
      }

      const q = query(
        diaryRef,
        where('userId', '==', currentUser.uid),
        where('petId', '==', petId)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const entries = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as DiaryEntry)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        observer.next(entries);
      }, (error) => observer.error(error));

      return {unsubscribe};
    });
  }

  getDiaryEntriesByUser(userId: string): Observable<DiaryEntry[]> {
    return new Observable<DiaryEntry[]>((observer) => {
      const diaryRef = collection(this.firestore, 'diary');
      const q = query(diaryRef, where('userId', '==', userId));

      // TODO: extraer en un nuevo método donde se extrae el filtro que se quiere (por usuario o por mascota) y reusar
      // lo común
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const entries = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as DiaryEntry))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        observer.next(entries);
      }, (error) => observer.error(error));

      return {unsubscribe};
    });
  }

  async addDiaryEntry(entryData: Omit<DiaryEntry, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, 'diary'), entryData);
    return docRef.id;
  }

  async updateDiaryEntry(entryId: string, entryData: Partial<DiaryEntry>): Promise<void> {
    const docReference = doc(this.firestore, 'diary', entryId);
    await updateDoc(docReference, entryData);
  }

  async deleteDiaryEntry(entryId: string): Promise<void> {
    const docReference = doc(this.firestore, 'diary', entryId);
    await deleteDoc(docReference);
  }
}
