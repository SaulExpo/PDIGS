import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { PetsService } from "../../services/pets/pets.service";
import { DiaryService } from "../../services/diary/diary.service";
import { Subscription } from "rxjs";
import { DiaryEntry, Pet } from "../../model/model.interface";
import { AlertService } from '../../services/alert/alert.service';

@Component({
  selector: 'app-diary',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './diary.component.html',
  styleUrl: './diary.component.css'
})
export class DiaryComponent implements OnInit, OnDestroy {
  pets: Pet[] = [];
  diaryEntries: DiaryEntry[] = [];
  private auth = inject(Auth);
  private translation = inject(TranslationService);
  private alertService = inject(AlertService);

  selectedPetId: string | null = null;
  showForm = false;
  isEditing = false;
  editingEntryId: string | null = null;
  showModal = false;
  modalVisible = false;
  selectedEntry: DiaryEntry | null = null;

  diaryForm = new FormGroup({
    date: new FormControl('', Validators.required),
    title: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required)
  });
  private petsService = inject(PetsService);
  private diaryService = inject(DiaryService);
  private petsSubscription: Subscription | null = null;
  private diarySubscription: Subscription | null = null;

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
    this.loadDiaryEntries(petId);
    this.showForm = false;
  }

  loadDiaryEntries(petId: string) {
    if (this.diarySubscription) this.diarySubscription.unsubscribe();

    this.diarySubscription = this.diaryService.getDiaryEntries(petId).subscribe({
      next: (entries) => this.diaryEntries = entries,
      error: (err) => console.error('Error loading entries:', err)
    });
  }

  showCreateForm() {
    this.isEditing = false;
    this.editingEntryId = null;
    this.diaryForm.reset();
    this.diaryForm.patchValue({date: new Date().toISOString().split('T')[0]});
    this.showForm = true;
  }

  showEditForm(entry: DiaryEntry) {
    this.isEditing = true;
    this.editingEntryId = entry.id;
    this.diaryForm.setValue({
      date: entry.date,
      title: entry.title,
      description: entry.description
    });
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.diaryForm.reset();
  }

  async saveEntry() {
    if (!this.diaryForm.valid || !this.selectedPetId) {
      this.diaryForm.markAllAsTouched();
      await this.alertService.validation(
        'Completa correctamente todos los campos de la entrada.',
        'Please fill in all entry fields correctly.'
      );
      return;
    }

    const formValue = this.diaryForm.value;
    const entryData = {
      petId: this.selectedPetId,
      date: formValue.date!,
      title: formValue.title!,
      description: formValue.description!,
      userId: this.auth.currentUser?.uid!
    };

    try {
      if (this.isEditing && this.editingEntryId) {
        await this.diaryService.updateDiaryEntry(this.editingEntryId, entryData);
        await this.alertService.success('update', this.getEntityLabel());
      } else {
        await this.diaryService.addDiaryEntry(entryData);
        await this.alertService.success('create', this.getEntityLabel());
      }
      this.cancelForm();
    } catch (error) {
      console.error('Error saving diary entry:', error);
      await this.alertService.error('save', this.getEntityLabel());
    }
  }

  async deleteEntry(entryId: string) {
    const confirmed = await this.alertService.confirmDelete(this.getEntityLabel());
    if (!confirmed) return;

    try {
      await this.diaryService.deleteDiaryEntry(entryId);
      await this.alertService.success('delete', this.getEntityLabel());
    } catch (error) {
      console.error('Error deleting diary entry:', error);
      await this.alertService.error('delete', this.getEntityLabel());
    }
  }

  openModal(entry: DiaryEntry) {
    this.selectedEntry = entry;
    this.showModal = true;
    setTimeout(() => {
      this.modalVisible = true;
    }, 10);
  }

  closeModal() {
    this.modalVisible = false;
    setTimeout(() => {
      this.showModal = false;
      this.selectedEntry = null;
    }, 300);
  }

  getSelectedPetName(): string {
    const pet = this.pets.find(p => p.id === this.selectedPetId);
    return pet ? pet.name : '';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const locale = this.translation.getLanguage() === 'en' ? 'en-US' : 'es-ES';
    return date.toLocaleDateString(locale, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
  }

  private getEntityLabel() {
    return this.translation.getLanguage() === 'en' ? 'entry' : 'entrada';
  }

  ngOnDestroy() {
    if (this.petsSubscription) this.petsSubscription.unsubscribe();
    if (this.diarySubscription) this.diarySubscription.unsubscribe();
  }
}
