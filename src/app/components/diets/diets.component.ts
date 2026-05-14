import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { Diet, Pet } from '../../model/model.interface';
import { Subscription } from "rxjs";
import { PetsService } from "../../services/pets/pets.service";
import { DietsService } from "../../services/diets/diets.service";
import { TranslationService } from '../../i18n/translation.service';
import { AlertService } from '../../services/alert/alert.service';
import { CloudinaryService } from '../../services/cloudinary/cloudinary.service';

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
  isUploadingPhoto = false;
  selectedPhotoFile: File | null = null;
  photoPreviewUrl = '';

  dietForm = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
    mainPhotoUrl: new FormControl('')
  });
  private petsService = inject(PetsService);
  private dietsService = inject(DietsService);
  private translation = inject(TranslationService);
  private alertService = inject(AlertService);
  private cloudinaryService = inject(CloudinaryService);
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
    this.clearSelectedPhoto();
    this.isEditing = false;
    this.editingDietId = null;
    this.dietForm.reset();
    this.showForm = true;
  }

  showEditForm(diet: Diet) {
    this.clearSelectedPhoto();
    this.isEditing = true;
    this.editingDietId = diet.id;
    this.dietForm.setValue({
      name: diet.name,
      description: diet.description,
      mainPhotoUrl: diet.mainPhotoUrl || ''
    });
    this.showForm = true;
  }

  cancelForm() {
    this.clearSelectedPhoto();
    this.showForm = false;
    this.dietForm.reset();
  }

  async onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    this.clearSelectedPhoto();

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      await this.alertService.validation('Selecciona un archivo de imagen.', 'Please select an image file.');
      input.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      await this.alertService.validation('La imagen debe ocupar 10 MB o menos.', 'The image must be 10 MB or smaller.');
      input.value = '';
      return;
    }

    this.selectedPhotoFile = file;
    this.photoPreviewUrl = URL.createObjectURL(file);
  }

  clearSelectedPhoto() {
    if (this.photoPreviewUrl) {
      URL.revokeObjectURL(this.photoPreviewUrl);
    }

    this.selectedPhotoFile = null;
    this.photoPreviewUrl = '';
  }

  async saveDiet() {
    if (!this.dietForm.valid || !this.selectedPetId) {
      this.dietForm.markAllAsTouched();
      await this.alertService.validation(
        'Completa correctamente todos los campos de la dieta.',
        'Please fill in all diet fields correctly.'
      );
      return;
    }

    const formValue = this.dietForm.value;
    let mainPhotoUrl = formValue.mainPhotoUrl || '';

    if (this.selectedPhotoFile) {
      try {
        this.isUploadingPhoto = true;
        mainPhotoUrl = await this.cloudinaryService.uploadImage(this.selectedPhotoFile);
        this.dietForm.patchValue({ mainPhotoUrl });
      } catch (error) {
        console.error('Error uploading diet photo:', error);
        const message = error instanceof Error ? error.message : 'No se pudo subir la foto.';
        await this.alertService.validation(
          `No se pudo subir la foto a Cloudinary: ${message}`,
          `Could not upload the photo to Cloudinary: ${message}`
        );
        return;
      } finally {
        this.isUploadingPhoto = false;
      }
    }

    const dietData = {
      petId: this.selectedPetId,
      name: formValue.name!,
      description: formValue.description!,
      mainPhotoUrl,
      userId: this.auth.currentUser?.uid || ''
    };

    try {
      if (this.isEditing && this.editingDietId) {
        await this.dietsService.updateDiet(this.editingDietId, dietData);
        await this.alertService.success('update', this.getEntityLabel());
      } else {
        await this.dietsService.addDiet(dietData);
        await this.alertService.success('create', this.getEntityLabel());
      }
      this.cancelForm();
    } catch (error) {
      console.error('Error saving diet:', error);
      await this.alertService.error('save', this.getEntityLabel());
    }
  }

  getSelectedPetName(): string {
    const pet = this.pets.find(p => p.id === this.selectedPetId);
    return pet ? pet.name : '';
  }

  async deleteDiet(dietId: string) {
    const confirmed = await this.alertService.confirmDelete(this.getEntityLabel());
    if (!confirmed) return;

    try {
      await this.dietsService.deleteDiet(dietId);
      await this.alertService.success('delete', this.getEntityLabel());
    } catch (error) {
      console.error('Error deleting diet:', error);
      await this.alertService.error('delete', this.getEntityLabel());
    }
  }

  private getEntityLabel() {
    return this.translation.getLanguage() === 'en' ? 'diet' : 'dieta';
  }

  ngOnDestroy() {
    this.clearSelectedPhoto();
    if (this.petsSubscription) this.petsSubscription.unsubscribe();
    if (this.dietsSubscription) this.dietsSubscription.unsubscribe();
  }
}
