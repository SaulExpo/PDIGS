import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { Subscription } from "rxjs";
import { PetsService } from "../../services/pets/pets.service";

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
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './pets.component.html',
  styleUrl: './pets.component.css'
})
export class PetsComponent implements OnInit, OnDestroy {
  pets: Pet[] = [];
  private petsService = inject(PetsService);
  private auth = inject(Auth);

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
  private translation = inject(TranslationService);
  private petsSubscription: Subscription | null = null;

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.userName = user.displayName || this.translation.translate('sidebar.defaultUser');
        this.loadPets(user.uid);
      }
    });
  }

  loadPets(userId: string) {
    if (this.petsSubscription) this.petsSubscription.unsubscribe();

    this.petsSubscription = this.petsService.getPets(userId).subscribe({
      next: (pets) => this.pets = pets,
      error: (err) => console.error('Error loading pets:', err)
    });
  }

  async deletePet(petId: string) {
    try {
      await this.petsService.deletePet(petId);
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
        userId: this.auth.currentUser?.uid!
      };

      try {
        if (this.isEditing && this.editingPetId) {
          await this.petsService.updatePet(this.editingPetId, petData);
        } else {
          await this.petsService.addPet(petData);
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

  ngOnDestroy() {
    if (this.petsSubscription) this.petsSubscription.unsubscribe();
  }
}
