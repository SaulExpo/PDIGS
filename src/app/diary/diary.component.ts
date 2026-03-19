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

interface DiaryEntry {
  id: string;
  petId: string;
  date: string;
  title: string;
  description: string;
  userId: string;
}

@Component({
    selector: 'app-diary',
    imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
    templateUrl: './diary.component.html',
    styleUrl: './diary.component.css'
})
export class DiaryComponent implements OnInit {
  pets: Pet[] = [];
  diaryEntries: DiaryEntry[] = [];
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

  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private translation = inject(TranslationService);

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
    this.loadDiaryEntries(petId);
    this.showForm = false;
  }

  loadDiaryEntries(petId: string) {
    const diaryRef = collection(this.firestore, 'diary');
    const q = query(diaryRef, where('petId', '==', petId));
    onSnapshot(q, (querySnapshot) => {
      this.diaryEntries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DiaryEntry)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  }

  showCreateForm() {
    this.isEditing = false;
    this.editingEntryId = null;
    this.diaryForm.reset();
    this.diaryForm.patchValue({ date: new Date().toISOString().split('T')[0] });
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
    if (this.diaryForm.valid && this.selectedPetId) {
      const formValue = this.diaryForm.value;
      const entryData = {
        petId: this.selectedPetId,
        date: formValue.date!,
        title: formValue.title!,
        description: formValue.description!,
        userId: this.auth.currentUser?.uid
      };

      try {
        if (this.isEditing && this.editingEntryId) {
          await updateDoc(doc(this.firestore, 'diary', this.editingEntryId), entryData);
        } else {
          await addDoc(collection(this.firestore, 'diary'), entryData);
        }
        this.cancelForm();
      } catch (error) {
        console.error('Error saving diary entry:', error);
      }
    }
  }

  async deleteEntry(entryId: string) {
    try {
      await deleteDoc(doc(this.firestore, 'diary', entryId));
    } catch (error) {
      console.error('Error deleting diary entry:', error);
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
    return date.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
}
