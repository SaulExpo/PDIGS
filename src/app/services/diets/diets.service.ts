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
import { Diet } from "../../model/model.interface";

@Injectable({
  providedIn: 'root',
})
export class DietsService {
  private firestore = inject(Firestore);

  getDiets(petId: string): Observable<Diet[]> {
    return new Observable<Diet[]>((observer) => {
      const dietsRef = collection(this.firestore, 'diets');
      const q = query(dietsRef, where('petId', '==', petId));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const diets = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Diet));
        observer.next(diets);
      }, (error) => observer.error(error));

      return {unsubscribe};
    });
  }

  async addDiet(dietData: Omit<Diet, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, 'diets'), dietData);
    return docRef.id;
  }

  async updateDiet(dietId: string, dietData: Partial<Diet>): Promise<void> {
    const docReference = doc(this.firestore, 'diets', dietId);
    await updateDoc(docReference, dietData);
  }

  async deleteDiet(dietId: string): Promise<void> {
    const docReference = doc(this.firestore, 'diets', dietId);
    await deleteDoc(docReference);
  }
}
