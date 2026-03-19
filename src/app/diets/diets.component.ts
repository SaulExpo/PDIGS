import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { addDoc, collection, deleteDoc, doc, Firestore, onSnapshot, query, updateDoc, where } from '@angular/fire/firestore';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../i18n/translate.pipe';

interface Pet {
  id: string;
  name: string;
  type: string;
  age: number;
  breed: string;
  userId: string;
}

interface Diet {
  id: string;
  petId: string;
  name: string;
  description: string;
  userId: string;
}

@Component({
  selector: 'app-diets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './diets.component.html',
  styleUrl: './diets.component.css'
})
export class DietsComponent implements OnInit {
  pets: Pet[] = [];
  diets: Diet[] = [];
  selectedPetId: string | null = null;
  showForm = false;
  isEditing = false;
  editingDietId: string | null = null;

  dietForm = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required)
  });

  private firestore = inject(Firestore);
  private auth = inject(Auth);

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.loadPets(user.uid);
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
    });
  }

  selectPet(petId: string) {
    this.selectedPetId = petId;
    this.loadDiets(petId);
    this.showForm = false;
  }

  loadDiets(petId: string) {
    const dietsRef = collection(this.firestore, 'diets');
    const q = query(dietsRef, where('petId', '==', petId));
    onSnapshot(q, (querySnapshot) => {
      this.diets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Diet));
    });
  }

  showCreateForm() {
    this.isEditing = false;
    this.editingDietId = null;
    this.dietForm.reset();
    this.showForm = true;
  }

  showEditForm(diet: Diet) {
    this.isEditing = true;
    this.editingDietId = diet.id;
    this.dietForm.setValue({
      name: diet.name,
      description: diet.description
    });
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.dietForm.reset();
  }

  async saveDiet() {
    if (this.dietForm.valid && this.selectedPetId) {
      const formValue = this.dietForm.value;
      const dietData = {
        petId: this.selectedPetId,
        name: formValue.name!,
        description: formValue.description!,
        userId: this.auth.currentUser?.uid
      };

      try {
        if (this.isEditing && this.editingDietId) {
          await updateDoc(doc(this.firestore, 'diets', this.editingDietId), dietData);
        } else {
          await addDoc(collection(this.firestore, 'diets'), dietData);
        }
        this.cancelForm();
      } catch (error) {
        console.error('Error saving diet:', error);
      }
    }
  }

  getSelectedPetName(): string {
    const pet = this.pets.find(p => p.id === this.selectedPetId);
    return pet ? pet.name : '';
  }

  async deleteDiet(dietId: string) {
    try {
      await deleteDoc(doc(this.firestore, 'diets', dietId));
    } catch (error) {
      console.error('Error deleting diet:', error);
    }
  }
}
