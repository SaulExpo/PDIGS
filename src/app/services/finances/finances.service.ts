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
import { Expense } from '../../model/model.interface';

@Injectable({
  providedIn: 'root',
})
export class FinancesService {

  private firestore = inject(Firestore);

  getExpenses(petId: string): Observable<Expense[]> {
    return new Observable<Expense[]>((observer) => {
      const ref = collection(this.firestore, 'finances');
      const q = query(ref, where('petId', '==', petId));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const expenses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Expense))
          .sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );

        observer.next(expenses);
      }, (error) => observer.error(error));

      return { unsubscribe };
    });
  }

  getExpensesByUser(userId: string): Observable<Expense[]> {
    return new Observable<Expense[]>((observer) => {
      const ref = collection(this.firestore, 'finances');
      const q = query(ref, where('userId', '==', userId));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const expenses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Expense))
          .sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );

        observer.next(expenses);
      }, (error) => observer.error(error));

      return { unsubscribe };
    });
  }

  async addExpense(data: Omit<Expense, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, 'finances'), data);
    return docRef.id;
  }

  async updateExpense(id: string, data: Partial<Expense>): Promise<void> {
    const ref = doc(this.firestore, 'finances', id);
    await updateDoc(ref, data);
  }

  async deleteExpense(id: string): Promise<void> {
    const ref = doc(this.firestore, 'finances', id);
    await deleteDoc(ref);
  }
}
