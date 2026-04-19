import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { PetsService } from '../../services/pets/pets.service';
import { FinancesService } from '../../services/finances/finances.service';
import { TranslationService } from '../../i18n/translation.service';
import { Subscription } from 'rxjs';
import { Pet, Expense } from '../../model/model.interface';
import { Chart } from 'chart.js/auto';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-finances',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './finances.component.html',
  styleUrl: './finances.component.css'
})
export class FinancesComponent implements OnInit, OnDestroy {

  pets: Pet[] = [];
  expenses: Expense[] = [];

  selectedPetId: string | null = null;

  showForm = false;
  isEditing = false;
  editingExpenseId: string | null = null;

  showModal = false;
  selectedExpense: Expense | null = null;

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  expenseForm = new FormGroup({
    date: new FormControl<string>(''),
    amount: new FormControl<number>(0),
    category: new FormControl<'food' | 'vet' | 'grooming' | 'other'>('food'),
    description: new FormControl<string>('')
  });

  private auth = inject(Auth);
  private petsService = inject(PetsService);
  private financesService = inject(FinancesService);
  private translation = inject(TranslationService);

  private petsSub?: Subscription;
  private finSub?: Subscription;

  ngOnInit() {
    onAuthStateChanged(this.auth, user => {
      if (user) this.loadPets(user.uid);
    });
  }

  loadPets(userId: string) {
    this.petsSub = this.petsService.getPets(userId)
      .subscribe(p => this.pets = p);
  }

  selectPet(petId: string) {
    this.selectedPetId = petId;
    this.loadExpenses(petId);
  }

  loadExpenses(petId: string) {
    this.finSub = this.financesService.getExpenses(petId)
      .subscribe(e => {
        this.expenses = e;
        setTimeout(() => this.createChart(), 0);
      });
  }

  showCreateForm() {
    this.isEditing = false;
    this.expenseForm.reset({ category: 'food' });
    this.showForm = true;
  }

  showEditForm(entry: Expense) {
    this.isEditing = true;
    this.editingExpenseId = entry.id;

    this.expenseForm.setValue({
      date: entry.date,
      amount: entry.amount,
      category: entry.category,
      description: entry.description
    });

    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
  }

  async saveEntry() {
    if (!this.selectedPetId) return;

    const data = {
      ...this.expenseForm.value,
      petId: this.selectedPetId,
      userId: this.auth.currentUser?.uid!
    } as any;

    if (this.isEditing) {
      await this.financesService.updateExpense(this.editingExpenseId!, data);
    } else {
      await this.financesService.addExpense(data);
    }

    this.cancelForm();
  }

  async deleteEntry(id: string) {
    await this.financesService.deleteExpense(id);
  }

  openModal(e: Expense) {
    this.selectedExpense = e;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  getSelectedPetName(): string {
    return this.pets.find(p => p.id === this.selectedPetId)?.name || '';
  }

  formatDate(date: string) {
    return new Date(date).toLocaleDateString();
  }

  getTotal(): number {
    return this.expenses.reduce((sum, e) => sum + e.amount, 0);
  }

  createChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    const monthlyTotals: Record<string, number> = {};

    this.expenses.forEach(e => {
      const date = new Date(e.date);

      const month = date.toLocaleString('default', {
        month: 'short',
        year: 'numeric'
      });

      if (!monthlyTotals[month]) {
        monthlyTotals[month] = 0;
      }

      monthlyTotals[month] += e.amount;
    });

    const labels = Object.keys(monthlyTotals);
    const data = Object.values(monthlyTotals);

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '€ spent per month',
            data
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  generateReport() {
    const doc = new jsPDF();
    doc.text('Expenses Report', 10, 10);

    this.expenses.forEach((e, i) => {
      doc.text(`${e.date} - ${e.category} - ${e.amount}€`, 10, 20 + i * 10);
    });

    doc.save('report.pdf');
  }

  ngOnDestroy() {
    this.petsSub?.unsubscribe();
    this.finSub?.unsubscribe();
    this.chart?.destroy();
  }
}
