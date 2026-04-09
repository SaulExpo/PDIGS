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
import { MedicalEntry } from "../../model/model.interface";

@Injectable({ providedIn: 'root' })
export class MedicalService {
  private firestore = inject(Firestore);

  getEntries(petId: string): Observable<MedicalEntry[]> {
    return new Observable(observer => {
      const ref = collection(this.firestore, 'medical');
      const q = query(ref, where('petId', '==', petId));

      const unsub = onSnapshot(q, snap => {
        const data = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MedicalEntry))
          .sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );

        observer.next(data);
      });

      return { unsubscribe: unsub };
    });
  }

  async addEntry(data: Omit<MedicalEntry, 'id'>) {
    return addDoc(collection(this.firestore, 'medical'), data);
  }

  async updateEntry(id: string, data: Partial<MedicalEntry>) {
    return updateDoc(doc(this.firestore, 'medical', id), data);
  }

  async deleteEntry(id: string) {
    return deleteDoc(doc(this.firestore, 'medical', id));
  }
}
