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
import { AlertService } from '../../services/alert/alert.service';

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
  private alertService = inject(AlertService);

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
    const confirmed = await this.alertService.confirmDelete(this.getEntityLabel());
    if (!confirmed) return;

    try {
      await this.petsService.deletePet(petId);
      this.clearMessages();
      await this.alertService.success('delete', this.getEntityLabel());
    } catch (error) {
      console.error('Error deleting pet:', error);
      this.clearMessages();
      await this.alertService.error('delete', this.getEntityLabel());
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
      await this.alertService.error('export', 'PDF');
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
      this.petForm.markAllAsTouched();
      await this.alertService.validation(
        'Completa correctamente todos los campos.',
        'Please fill in all fields correctly.'
      );
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
        await this.alertService.success('update', this.getEntityLabel());
      } else {
        await this.petsService.addPet(petData);
        await this.alertService.success('create', this.getEntityLabel());
      }

      this.showForm = false;
      this.petForm.reset();
      this.isEditing = false;
      this.editingPetId = null;

    } catch (error) {
      console.error('Error saving pet:', error);
      await this.alertService.error('save', this.getEntityLabel());
    }
  }

  private getEntityLabel() {
    return this.translation.getLanguage() === 'en' ? 'pet' : 'mascota';
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
