import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { Diet, Pet } from '../../model/model.interface';
import { Subscription } from "rxjs";
import { PetsService } from "../../services/pets/pets.service";
import { DietsService } from "../../services/diets/diets.service";

@Component({
  selector: 'app-diets',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './diets.component.html',
  styleUrl: './diets.component.css'
})
export class DietsComponent implements OnInit, OnDestroy {
  pets: Pet[] = [];
  diets: Diet[] = [];
  private auth = inject(Auth);

  selectedPetId: string | null = null;
  showForm = false;
  isEditing = false;
  editingDietId: string | null = null;

  dietForm = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required)
  });
  private petsService = inject(PetsService);
  private dietsService = inject(DietsService);
  private petsSubscription: Subscription | null = null;
  private dietsSubscription: Subscription | null = null;

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
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

  selectPet(petId: string) {
    this.selectedPetId = petId;
    this.loadDiets(petId);
    this.showForm = false;
  }

  loadDiets(petId: string) {
    if (this.dietsSubscription) this.dietsSubscription.unsubscribe();

    this.dietsSubscription = this.dietsService.getDiets(petId).subscribe({
      next: (diets) => this.diets = diets,
      error: (err) => console.error('Error loading diets:', err)
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
        userId: this.auth.currentUser?.uid || ''
      };

      try {
        if (this.isEditing && this.editingDietId) {
          await this.dietsService.updateDiet(this.editingDietId, dietData);
        } else {
          await this.dietsService.addDiet(dietData);
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
      await this.dietsService.deleteDiet(dietId);
    } catch (error) {
      console.error('Error deleting diet:', error);
    }
  }

  ngOnDestroy() {
    if (this.petsSubscription) this.petsSubscription.unsubscribe();
    if (this.dietsSubscription) this.dietsSubscription.unsubscribe();
  }
}
