import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { PetExportData } from '../../model/model.interface';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {
  exportPetData(data: PetExportData): void {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const left = 15;
    const right = 15;
    const maxWidth = pageWidth - left - right;

    let y = 20;

    const addSectionTitle = (title: string) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(title, left, y);
      y += 8;
    };

    const addText = (text: string) => {
      const lines = doc.splitTextToSize(text, maxWidth);
      if (y + lines.length * 7 > pageHeight - 15) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(lines, left, y);
      y += lines.length * 7 + 2;
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`Pet Report: ${data.pet.name}`, left, y);
    y += 12;

    addSectionTitle('Pet information');
    addText(`Name: ${data.pet.name}`);
    addText(`Type: ${data.pet.type}`);
    addText(`Age: ${data.pet.age}`);
    addText(`Breed: ${data.pet.breed}`);
    addText(`Owner: ${data.ownerName}`);
    addText(`Generated on: ${new Date().toLocaleDateString()}`);

    addSectionTitle('Diet');
    if (data.diets.length === 0) {
      addText('No diet records available.');
    } else {
      data.diets.forEach((diet, index) => {
        addText(`${index + 1}. ${diet.name}`);
        addText(`Description: ${diet.description}`);
      });
    }

    addSectionTitle('Diary');
    if (data.diaryEntries.length === 0) {
      addText('No diary entries available.');
    } else {
      data.diaryEntries.forEach((entry, index) => {
        addText(`${index + 1}. ${entry.date} - ${entry.title}`);
        addText(`Description: ${entry.description}`);
      });
    }

    addSectionTitle('Medical records');
    if (data.medicalRecords.length === 0) {
      addText('No medical records available yet.');
    } else {
      data.medicalRecords.forEach((record, index) => {
        addText(`${index + 1}. ${record}`);
      });
    }

    addSectionTitle('Expenses');
    if (data.expenses.length === 0) {
      addText('No expense records available yet.');
    } else {
      data.expenses.forEach((expense, index) => {
        addText(`${index + 1}. ${expense}`);
      });
    }

    const safeName = data.pet.name.replace(/\s+/g, '-').toLowerCase();
    doc.save(`${safeName}-report.pdf`);
  }
}