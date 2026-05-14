export interface Pet {
  id: string;
  name: string;
  type: string;
  age: number;
  breed: string;
  mainPhotoUrl?: string;
  userId: string;
}

export interface DiaryEntry {
  id: string;
  petId: string;
  date: string;
  title: string;
  description: string;
  mainPhotoUrl?: string;
  userId: string;
}

export interface Diet {
  id: string;
  petId: string;
  name: string;
  description: string;
  mainPhotoUrl?: string;
  userId: string;
}

export interface MedicalEntry {
  id: string;
  petId: string;
  userId: string;
  date: string;
  type: 'vaccine' | 'test' | 'other';
  description: string;
}

export interface PetExportData {
  pet: Pet;
  diets: Diet[];
  diaryEntries: DiaryEntry[];
  medicalRecords: string[];
  expenses: string[];
  ownerName: string;
}

export interface CalendarEventEntry {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  petId: string;
  userId: string;
  hasReminder?: boolean;
  reminderDate?: string;
  reminderTime?: string;
  reminderMessage?: string;
}

export interface Expense {
  id: string;
  petId: string;
  userId: string;
  date: string;

  amount: number;

  category: 'food' | 'vet' | 'grooming' | 'other';

  description: string;
}
