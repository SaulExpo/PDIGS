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
import { Pet } from "../../model/model.interface";

@Injectable({
  providedIn: 'root',
})
export class PetsService {
  private firestore = inject(Firestore);

  getPets(userId: string): Observable<Pet[]> {
    return new Observable<Pet[]>((observer) => {
      const petsRef = collection(this.firestore, 'pets');
      const q = query(petsRef, where('userId', '==', userId));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const pets = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Pet));
        observer.next(pets);
      }, (error) => observer.error(error));

      return {unsubscribe};
    });
  }

  async addPet(petData: Omit<Pet, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, 'pets'), petData);
    return docRef.id;
  }

  async updatePet(petId: string, petData: Partial<Pet>): Promise<void> {
    const docReference = doc(this.firestore, 'pets', petId);
    await updateDoc(docReference, petData);
  }

  async deletePet(petId: string): Promise<void> {
    const docReference = doc(this.firestore, 'pets', petId);
    await deleteDoc(docReference);
  }
}
