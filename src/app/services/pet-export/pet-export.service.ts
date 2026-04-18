import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DietsService } from '../diets/diets.service';
import { DiaryService } from '../diary/diary.service';
import { MedicalService } from '../medical/medical.service';
import { Pet, PetExportData } from '../../model/model.interface';

@Injectable({
  providedIn: 'root'
})
export class PetExportService {
  private dietsService = inject(DietsService);
  private diaryService = inject(DiaryService);
  private medicalService = inject(MedicalService);

  async getPetExportData(pet: Pet, ownerName: string): Promise<PetExportData> {
    const [diets, diaryEntries, medicalEntries] = await Promise.all([
      firstValueFrom(this.dietsService.getDiets(pet.id)),
      firstValueFrom(this.diaryService.getDiaryEntries(pet.id)),
      firstValueFrom(this.medicalService.getEntries(pet.id))
    ]);

    return {
      pet,
      diets,
      diaryEntries,
      medicalRecords: medicalEntries.map((entry) => {
        const typeLabel =
          entry.type === 'vaccine'
            ? 'Vaccine'
            : entry.type === 'test'
              ? 'Test'
              : 'Other';

        return `${entry.date} - ${typeLabel}: ${entry.description || 'No description'}`;
      }),
      expenses: [],
      ownerName
    };
  }
}