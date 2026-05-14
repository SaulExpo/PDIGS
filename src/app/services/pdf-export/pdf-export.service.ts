import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { DiaryEntry, Diet, PetExportData } from '../../model/model.interface';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {
  async exportPetData(data: PetExportData): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    let y = 18;

    const ensureSpace = (height: number) => {
      if (y + height > pageHeight - margin) {
        doc.addPage();
        y = 18;
      }
    };

    const addSectionTitle = (title: string) => {
      ensureSpace(16);
      doc.setFillColor(238, 248, 242);
      doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(20, 61, 42);
      doc.text(title, margin + 4, y + 7);
      y += 16;
    };

    const addText = (label: string, value: string) => {
      const text = label ? `${label}: ${value}` : value;
      const lines = doc.splitTextToSize(text, contentWidth);
      ensureSpace(lines.length * 6 + 3);
      doc.setFont('helvetica', label ? 'bold' : 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(32, 49, 39);
      doc.text(lines, margin, y);
      y += lines.length * 6 + 2;
    };

    doc.setFillColor(29, 96, 60);
    doc.rect(0, 0, pageWidth, 34, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text(`Informe de ${data.pet.name}`, margin, 21);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, margin, 28);
    y = 46;

    const petImage = await this.loadImageAsJpeg(data.pet.mainPhotoUrl);
    if (petImage) {
      doc.addImage(petImage, 'JPEG', margin, y, 44, 34);
    } else {
      doc.setFillColor(219, 240, 226);
      doc.roundedRect(margin, y, 44, 34, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(20, 61, 42);
      doc.text(data.pet.name.charAt(0).toUpperCase(), margin + 19, y + 22);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(32, 49, 39);
    doc.text(`Nombre: ${data.pet.name}`, margin + 52, y + 7);
    doc.text(`Tipo: ${data.pet.type}`, margin + 52, y + 14);
    doc.text(`Raza: ${data.pet.breed}`, margin + 52, y + 21);
    doc.text(`Edad: ${data.pet.age}`, margin + 52, y + 28);
    doc.text(`Responsable: ${data.ownerName}`, margin + 52, y + 35);
    y += 48;

    await this.addDiets(doc, data.diets, addSectionTitle, addText, ensureSpace, margin, contentWidth, () => y, value => y = value);
    await this.addDiary(doc, data.diaryEntries, addSectionTitle, addText, ensureSpace, margin, contentWidth, () => y, value => y = value);

    addSectionTitle('Registros medicos');
    if (data.medicalRecords.length === 0) {
      addText('', 'No hay registros medicos disponibles.');
    } else {
      data.medicalRecords.forEach((record, index) => addText('', `${index + 1}. ${record}`));
    }

    addSectionTitle('Gastos');
    if (data.expenses.length === 0) {
      addText('', 'No hay gastos disponibles.');
    } else {
      data.expenses.forEach((expense, index) => addText('', `${index + 1}. ${expense}`));
    }

    const safeName = data.pet.name.replace(/\s+/g, '-').toLowerCase();
    doc.save(`${safeName}-report.pdf`);
  }

  private async addDiets(
    doc: jsPDF,
    diets: Diet[],
    addSectionTitle: (title: string) => void,
    addText: (label: string, value: string) => void,
    ensureSpace: (height: number) => void,
    margin: number,
    contentWidth: number,
    getY: () => number,
    setY: (value: number) => void
  ) {
    addSectionTitle('Dietas');
    if (diets.length === 0) {
      addText('', 'No hay dietas disponibles.');
      return;
    }

    for (const [index, diet] of diets.entries()) {
      ensureSpace(28);
      let y = getY();
      const image = await this.loadImageAsJpeg(diet.mainPhotoUrl);
      if (image) {
        doc.addImage(image, 'JPEG', margin, y, 30, 22);
      }

      const textLeft = image ? margin + 36 : margin;
      const textWidth = image ? contentWidth - 36 : contentWidth;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(32, 49, 39);
      doc.text(`${index + 1}. ${diet.name}`, textLeft, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(diet.description || 'Sin descripcion', textWidth);
      doc.text(lines, textLeft, y + 12);
      y += Math.max(26, lines.length * 5 + 14);
      setY(y);
    }
  }

  private async addDiary(
    doc: jsPDF,
    entries: DiaryEntry[],
    addSectionTitle: (title: string) => void,
    addText: (label: string, value: string) => void,
    ensureSpace: (height: number) => void,
    margin: number,
    contentWidth: number,
    getY: () => number,
    setY: (value: number) => void
  ) {
    addSectionTitle('Diario');
    if (entries.length === 0) {
      addText('', 'No hay entradas de diario disponibles.');
      return;
    }

    for (const [index, entry] of entries.entries()) {
      ensureSpace(30);
      let y = getY();
      const image = await this.loadImageAsJpeg(entry.mainPhotoUrl);
      if (image) {
        doc.addImage(image, 'JPEG', margin, y, 30, 22);
      }

      const textLeft = image ? margin + 36 : margin;
      const textWidth = image ? contentWidth - 36 : contentWidth;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(32, 49, 39);
      doc.text(`${index + 1}. ${entry.date} - ${entry.title}`, textLeft, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(entry.description || 'Sin descripcion', textWidth);
      doc.text(lines, textLeft, y + 12);
      y += Math.max(28, lines.length * 5 + 14);
      setY(y);
    }
  }

  private loadImageAsJpeg(url?: string): Promise<string | null> {
    if (!url) return Promise.resolve(null);

    return new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const context = canvas.getContext('2d');
        if (!context) {
          resolve(null);
          return;
        }

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      image.onerror = () => resolve(null);
      image.src = url;
    });
  }
}
