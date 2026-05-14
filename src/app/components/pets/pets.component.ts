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
import { CloudinaryService } from '../../services/cloudinary/cloudinary.service';

type PetType = 'perro' | 'gato' | 'ave' | 'reptil' | 'otro';

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
  private cloudinaryService = inject(CloudinaryService);

  showForm = false;
  isEditing = false;
  editingPetId: string | null = null;
  showModal = false;
  modalVisible = false;
  selectedPet: Pet | null = null;
  userName = '';
  isExporting = false;
  isUploadingPhoto = false;
  selectedPhotoFile: File | null = null;
  photoPreviewUrl = '';

  successMessage = '';
  errorMessage = '';

  readonly petTypes = [
    { value: 'perro', label: 'Perro', icon: 'fa-dog' },
    { value: 'gato', label: 'Gato', icon: 'fa-cat' },
    { value: 'ave', label: 'Ave', icon: 'fa-dove' },
    { value: 'reptil', label: 'Reptil', icon: 'fa-dragon' },
    { value: 'otro', label: 'Otro', icon: 'fa-paw' }
  ];

  readonly breedOptions: Record<Exclude<PetType, 'otro'>, string[]> = {
    perro: [
      'Labrador Retriever',
      'Pastor Aleman',
      'Golden Retriever',
      'Bulldog Frances',
      'Beagle',
      'Chihuahua',
      'Caniche',
      'Yorkshire Terrier',
      'Boxer',
      'Mestizo'
    ],
    gato: [
      'Siames',
      'Persa',
      'Maine Coon',
      'Bengali',
      'Sphynx',
      'British Shorthair',
      'Ragdoll',
      'Europeo comun',
      'Azul ruso',
      'Mestizo'
    ],
    ave: [
      'Periquito',
      'Canario',
      'Agapornis',
      'Ninfa',
      'Loro',
      'Cacatua',
      'Diamante mandarin',
      'Jilguero',
      'Cotorra',
      'Guacamayo'
    ],
    reptil: [
      'Tortuga',
      'Gecko leopardo',
      'Dragon barbudo',
      'Iguana',
      'Camaleon',
      'Serpiente del maiz',
      'Piton bola',
      'Anolis',
      'Escinco',
      'Tortuga acuatica'
    ]
  };

  petForm = new FormGroup({
    name: new FormControl('', Validators.required),
    type: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(perro|gato|ave|reptil|otro)$/)
    ]),
    age: new FormControl('', [Validators.required, Validators.min(0)]),
    breed: new FormControl('', Validators.required),
    mainPhotoUrl: new FormControl('', Validators.pattern(/^$|https?:\/\/.+/))
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

      await this.pdfExportService.exportPetData(exportData);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      await this.alertService.error('export', 'PDF');
    } finally {
      this.isExporting = false;
    }
  }

  showCreateForm() {
    this.clearMessages();
    this.clearSelectedPhoto();
    this.isEditing = false;
    this.editingPetId = null;
    this.petForm.reset({ type: '', breed: '' });
    this.showForm = true;
  }

  showEditForm(pet: Pet) {
    this.clearMessages();
    this.clearSelectedPhoto();
    this.isEditing = true;
    this.editingPetId = pet.id;
    const allowedType = this.isPetType(pet.type) ? pet.type : 'otro';
    const allowedBreed = this.hasPresetBreeds(allowedType) && this.breedOptions[allowedType].includes(pet.breed)
      ? pet.breed
      : allowedType === 'otro'
        ? pet.breed || pet.type
        : '';
    this.petForm.setValue({
      name: pet.name,
      type: allowedType,
      age: pet.age.toString(),
      breed: allowedBreed,
      mainPhotoUrl: pet.mainPhotoUrl || ''
    });
    this.showForm = true;
  }

  setPetType(type: string) {
    if (!this.isPetType(type)) return;

    this.petForm.patchValue({
      type,
      breed: ''
    });
    this.petForm.get('type')?.markAsTouched();
    this.petForm.get('breed')?.markAsUntouched();
  }

  setBreed(breed: string) {
    this.petForm.patchValue({ breed });
    this.petForm.get('breed')?.markAsTouched();
  }

  getBreedOptions(): string[] {
    const type = this.petForm.get('type')?.value;
    return this.hasPresetBreeds(type) ? this.breedOptions[type] : [];
  }

  getBreedIcon(): string {
    const type = this.petForm.get('type')?.value;
    const typeOption = this.petTypes.find(option => option.value === type);
    return typeOption?.icon || 'fa-paw';
  }

  isOtherTypeSelected(): boolean {
    return this.petForm.get('type')?.value === 'otro';
  }

  cancelForm() {
    this.clearMessages();
    this.clearSelectedPhoto();
    this.showForm = false;
    this.petForm.reset();
    this.isEditing = false;
    this.editingPetId = null;
  }

  async onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    this.clearSelectedPhoto();

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      await this.alertService.validation(
        'Selecciona un archivo de imagen.',
        'Please select an image file.'
      );
      input.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      await this.alertService.validation(
        'La imagen debe ocupar 10 MB o menos.',
        'The image must be 10 MB or smaller.'
      );
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
    if (
      !this.isPetType(formValue.type) ||
      (this.hasPresetBreeds(formValue.type) && !this.breedOptions[formValue.type].includes(formValue.breed!))
    ) {
      this.petForm.get('breed')?.markAsTouched();
      await this.alertService.validation(
        'Selecciona una raza valida para el tipo de mascota.',
        'Please select a valid breed for the pet type.'
      );
      return;
    }

    let mainPhotoUrl = (formValue.mainPhotoUrl || '').trim();

    if (this.selectedPhotoFile) {
      try {
        this.isUploadingPhoto = true;
        mainPhotoUrl = await this.cloudinaryService.uploadImage(this.selectedPhotoFile);
        this.petForm.patchValue({ mainPhotoUrl });
      } catch (error) {
        console.error('Error uploading pet photo:', error);
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

    const petData = {
      name: formValue.name!,
      type: formValue.type!,
      age: parseInt(formValue.age!, 10),
      breed: formValue.breed!,
      mainPhotoUrl,
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
      this.clearSelectedPhoto();
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

  private isPetType(value: string | null | undefined): value is PetType {
    return value === 'perro' || value === 'gato' || value === 'ave' || value === 'reptil' || value === 'otro';
  }

  private hasPresetBreeds(value: string | null | undefined): value is Exclude<PetType, 'otro'> {
    return value === 'perro' || value === 'gato' || value === 'ave' || value === 'reptil';
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
    this.clearSelectedPhoto();
    if (this.petsSubscription) this.petsSubscription.unsubscribe();
  }
}
