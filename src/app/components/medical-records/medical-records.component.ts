import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { PetsService } from "../../services/pets/pets.service";
import { MedicalService } from "../../services/medical/medical.service";
import { Subscription } from "rxjs";
import { MedicalEntry, Pet } from "../../model/model.interface";
import { AlertService } from '../../services/alert/alert.service';

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './medical-records.component.html',
  styleUrl: './medical-records.component.css'
})
export class MedicalRecordsComponent implements OnInit, OnDestroy {

  // 🔹 DATA
  pets: Pet[] = [];
  medicalEntries: MedicalEntry[] = [];

  selectedPetId: string | null = null;

  // 🔹 FORM STATE
  showForm = false;
  isEditing = false;
  editingEntryId: string | null = null;

  // 🔹 MODAL
  showModal = false;
  selectedEntry: MedicalEntry | null = null;

  // 🔹 FORM
  medicalForm = new FormGroup({
    date: new FormControl('', Validators.required),
    type: new FormControl('vaccine', Validators.required),
    description: new FormControl('')
  });

  // 🔹 SERVICES
  private auth = inject(Auth);
  private petsService = inject(PetsService);
  private medicalService = inject(MedicalService);
  private translation = inject(TranslationService);
  private alertService = inject(AlertService);

  private petsSub?: Subscription;
  private medicalSub?: Subscription;

  // ================= INIT =================

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.loadPets(user.uid);
      }
    });
  }

  // ================= PETS =================

  loadPets(userId: string) {
    this.petsSub?.unsubscribe();

    this.petsSub = this.petsService.getPets(userId).subscribe({
      next: (pets) => this.pets = pets
    });
  }

  selectPet(petId: string) {
    this.selectedPetId = petId;
    this.loadMedicalEntries(petId);
    this.showForm = false;
  }

  getSelectedPetName(): string {
    const pet = this.pets.find(p => p.id === this.selectedPetId);
    return pet ? pet.name : '';
  }

  // ================= MEDICAL =================

  loadMedicalEntries(petId: string) {
    this.medicalSub?.unsubscribe();

    this.medicalSub = this.medicalService.getEntries(petId).subscribe({
      next: (entries) => this.medicalEntries = entries
    });
  }

  // ================= FORM =================

  showCreateForm() {
    this.isEditing = false;
    this.editingEntryId = null;
    this.medicalForm.reset();
    this.showForm = true;
  }

  showEditForm(entry: MedicalEntry) {
    this.isEditing = true;
    this.editingEntryId = entry.id;

    this.medicalForm.setValue({
      date: entry.date,
      type: entry.type,
      description: entry.description
    });

    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.medicalForm.reset();
  }

  async saveEntry() {
    if (!this.medicalForm.valid || !this.selectedPetId) {
      this.medicalForm.markAllAsTouched();
      await this.alertService.validation(
        'Completa correctamente todos los campos del registro medico.',
        'Please fill in all medical record fields correctly.'
      );
      return;
    }

    const data = {
      petId: this.selectedPetId,
      userId: this.auth.currentUser?.uid!,
      date: this.medicalForm.value.date!,
      type: this.medicalForm.value.type as 'vaccine' | 'test' | 'other',
      description: this.medicalForm.value.description || ''
    };

    try {
      if (this.isEditing && this.editingEntryId) {
        await this.medicalService.updateEntry(this.editingEntryId, data);
        await this.alertService.success('update', this.getEntityLabel());
      } else {
        await this.medicalService.addEntry(data);
        await this.alertService.success('create', this.getEntityLabel());
      }

      this.cancelForm();
    } catch (error) {
      console.error('Error saving medical entry:', error);
      await this.alertService.error('save', this.getEntityLabel());
    }
  }

  async deleteEntry(id: string) {
    const confirmed = await this.alertService.confirmDelete(this.getEntityLabel());
    if (!confirmed) return;

    try {
      await this.medicalService.deleteEntry(id);
      await this.alertService.success('delete', this.getEntityLabel());
    } catch (error) {
      console.error('Error deleting medical entry:', error);
      await this.alertService.error('delete', this.getEntityLabel());
    }
  }

  // ================= MODAL =================

  openModal(entry: MedicalEntry) {
    this.selectedEntry = entry;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedEntry = null;
  }

  // ================= UTILS =================

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const locale = this.translation.getLanguage() === 'en' ? 'en-US' : 'es-ES';

    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private getEntityLabel() {
    return this.translation.getLanguage() === 'en' ? 'medical record' : 'registro medico';
  }

  // ================= DESTROY =================

  ngOnDestroy() {
    this.petsSub?.unsubscribe();
    this.medicalSub?.unsubscribe();
  }
}
