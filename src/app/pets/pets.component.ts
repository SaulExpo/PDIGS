import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { addDoc, collection, deleteDoc, doc, Firestore, onSnapshot, query, updateDoc, where } from '@angular/fire/firestore';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../i18n/translate.pipe';
import { TranslationService } from '../i18n/translation.service';

interface Pet {
  id: string;
  name: string;
  type: string;
  age: number;
  breed: string;
  userId: string;
}

@Component({
  selector: 'app-pets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './pets.component.html',
  styleUrl: './pets.component.css'
})
export class PetsComponent implements OnInit {
  pets: Pet[] = [];
  showForm = false;
  isEditing = false;
  editingPetId: string | null = null;
  showModal = false;
  modalVisible = false;
  selectedPet: Pet | null = null;
  userName = '';

  petForm = new FormGroup({
    name: new FormControl('', Validators.required),
    type: new FormControl('', Validators.required),
    age: new FormControl('', [Validators.required, Validators.min(0)]),
    breed: new FormControl('', Validators.required)
  });

  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private translation = inject(TranslationService);

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.userName = user.displayName || this.translation.translate('sidebar.defaultUser');
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

  async deletePet(petId: string) {
    try {
      await deleteDoc(doc(this.firestore, 'pets', petId));
    } catch (error) {
      console.error('Error deleting pet:', error);
    }
  }

  showCreateForm() {
    this.isEditing = false;
    this.editingPetId = null;
    this.petForm.reset();
    this.showForm = true;
  }

  showEditForm(pet: Pet) {
    this.isEditing = true;
    this.editingPetId = pet.id;
    this.petForm.setValue({
      name: pet.name,
      type: pet.type,
      age: pet.age.toString(),
      breed: pet.breed
    });
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.petForm.reset();
  }

  async savePet() {
    if (this.petForm.valid) {
      const formValue = this.petForm.value;
      const petData = {
        name: formValue.name!,
        type: formValue.type!,
        age: parseInt(formValue.age!, 10),
        breed: formValue.breed!,
        userId: this.auth.currentUser?.uid
      };

      try {
        if (this.isEditing && this.editingPetId) {
          await updateDoc(doc(this.firestore, 'pets', this.editingPetId), petData);
        } else {
          await addDoc(collection(this.firestore, 'pets'), petData);
        }
        this.cancelForm();
      } catch (error) {
        console.error('Error saving pet:', error);
      }
    }
  }

  openModal(pet: Pet) {
    this.selectedPet = pet;
    this.showModal = true;
    setTimeout(() => {
      this.modalVisible = true;
    }, 10);
  }

  closeModal() {
    this.modalVisible = false;
    setTimeout(() => {
      this.showModal = false;
      this.selectedPet = null;
    }, 300);
  }
}
