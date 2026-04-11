import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { Subscription } from "rxjs";
import { PetsService } from "../../services/pets/pets.service";
import { Pet } from '../../model/model.interface';
import { PetExportService } from '../../services/pet-export/pet-export.service';
import { PdfExportService } from '../../services/pdf-export/pdf-export.service';

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
  private petExportService = inject(PetExportService);
  private pdfExportService = inject(PdfExportService);

  showForm = false;
  isEditing = false;
  editingPetId: string | null = null;
  showModal = false;
  modalVisible = false;
  selectedPet: Pet | null = null;
  userName = '';
  isExporting = false;

  successMessage = '';
  errorMessage = '';

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

  clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }

  async deletePet(petId: string) {
    try {
      await this.petsService.deletePet(petId);
      this.clearMessages();
      this.successMessage = 'Pet deleted successfully.';
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Error deleting pet:', error);
      this.clearMessages();
      this.errorMessage = 'An error occurred while deleting the pet.';
    }
  }

  async exportPetToPdf(pet: Pet) {
    try {
      this.isExporting = true;

      const exportData = await this.petExportService.getPetExportData(
        pet,
        this.userName || 'Unknown owner'
      );

      this.pdfExportService.exportPetData(exportData);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      this.errorMessage = 'There was an error generating the PDF.';
    } finally {
      this.isExporting = false;
    }
  }

  showCreateForm() {
    this.clearMessages();
    this.isEditing = false;
    this.editingPetId = null;
    this.petForm.reset();
    this.showForm = true;
  }

  showEditForm(pet: Pet) {
    this.clearMessages();
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
    this.clearMessages();
    this.showForm = false;
    this.petForm.reset();
    this.isEditing = false;
    this.editingPetId = null;
  }

  async savePet() {
    this.clearMessages();

    if (this.petForm.invalid) {
      this.errorMessage = 'Please fill in all fields correctly.';
      this.petForm.markAllAsTouched();
      return;
    }

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
        this.successMessage = 'Pet updated successfully.';
      } else {
        await this.petsService.addPet(petData);
        this.successMessage = 'Pet created successfully.';
      }

      this.showForm = false;
      this.petForm.reset();
      this.isEditing = false;
      this.editingPetId = null;

      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Error saving pet:', error);
      this.errorMessage = 'An error occurred while saving the pet.';
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