import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, FormsModule],
  templateUrl: './finances.component.html',
  styleUrl: './finances.component.css'
})
export class FinancesComponent implements OnInit, OnDestroy {

  pets: Pet[] = [];
  expenses: Expense[] = [];

  selectedPetId: string | null = null;

  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth() + 1;

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

  onFilterChange() {
    if (this.selectedPetId) {
      this.loadExpenses(this.selectedPetId);
    }
  }

  loadExpenses(petId: string) {
    this.finSub = this.financesService.getExpenses(petId)
      .subscribe(e => {
        // console.log('📦 RAW EXPENSES FROM DB:', e);

        this.expenses = e;

        // console.log('📊 STATE BEFORE CHART');
        // console.log('selectedYear:', this.selectedYear);
        // console.log('selectedMonth:', this.selectedMonth);

        // console.log('📊 PARSED DATES:');
        // e.forEach(x => {
        //   console.log(x.date, new Date(x.date));
        // });

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
      this.chart = undefined;
    }

    const year = Number(this.selectedYear);
    const month = Number(this.selectedMonth);

    const filtered = this.expenses.filter(e => {
      const d = new Date(e.date);

      return (
        d.getFullYear() === year &&
        d.getMonth() + 1 === month
      );
    });

    // console.log('✅ FILTERED RESULT:', filtered);

    // 👉 clamp semana dentro del mes (IMPORTANTE)
    const getClampedWeekStart = (date: Date) => {
      const d = new Date(date);

      const firstDayOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);

      // lunes como inicio
      const day = d.getDay();
      const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);

      let weekStart = new Date(d.setDate(diffToMonday));

      // 🔥 CLAMP: nunca antes del día 1 del mes
      if (weekStart < firstDayOfMonth) {
        weekStart = new Date(firstDayOfMonth);
      }

      return weekStart;
    };

    type WeekData = {
      key: string;
      label: string;
      food: number;
      vet: number;
      grooming: number;
      other: number;
    };

    const weekMap = new Map<string, WeekData>();

    for (const e of filtered) {
      const date = new Date(e.date);

      const weekStart = getClampedWeekStart(date);

      const key = weekStart.toISOString().split('T')[0];

      const label = `${String(weekStart.getDate()).padStart(2, '0')}/${String(weekStart.getMonth() + 1).padStart(2, '0')}`;

      if (!weekMap.has(key)) {
        weekMap.set(key, {
          key,
          label,
          food: 0,
          vet: 0,
          grooming: 0,
          other: 0
        });
      }

      const week = weekMap.get(key)!;

      week[e.category] += Number(e.amount);
    }

    // 👉 orden real por fecha
    const weekArray = Array.from(weekMap.values())
      .sort((a, b) => a.key.localeCompare(b.key));

    const labels = weekArray.map(w => w.label);

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Food',
            data: weekArray.map(w => w.food),
            backgroundColor: '#4caf50'
          },
          {
            label: 'Vet',
            data: weekArray.map(w => w.vet),
            backgroundColor: '#f44336'
          },
          {
            label: 'Grooming',
            data: weekArray.map(w => w.grooming),
            backgroundColor: '#ff9800'
          },
          {
            label: 'Other',
            data: weekArray.map(w => w.other),
            backgroundColor: '#9c27b0'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          x: {
            stacked: true
          },
          y: {
            stacked: true,
            beginAtZero: true
          }
        }
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
