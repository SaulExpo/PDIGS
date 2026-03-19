
import { Component, inject, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged, signOut } from '@angular/fire/auth';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '../i18n/translate.pipe';
import { SupportedLang, TranslationService } from '../i18n/translation.service';

@Component({
    selector: 'app-dashboard',
    imports: [RouterOutlet, RouterLink, TranslatePipe],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  userName = '';
  userPhotoURL = '';
  currentLanguage: SupportedLang;

  private auth = inject(Auth);
  private router = inject(Router);
  private translation = inject(TranslationService);

  constructor() {
    this.currentLanguage = this.translation.getLanguage();
  }

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.userName = user.displayName || this.translation.translate('sidebar.defaultUser');
        this.userPhotoURL = user.photoURL || 'https://via.placeholder.com/100';
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  setLanguage(language: string) {
    if (language === 'es' || language === 'en') {
      this.currentLanguage = language;
      this.translation.setLanguage(language);
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
}
