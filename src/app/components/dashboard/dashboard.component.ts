import { Component, HostListener, inject, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged, signOut } from '@angular/fire/auth';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { SupportedLang, TranslationService } from '../../i18n/translation.service';
import { ReminderNotificationsService } from '../../services/reminder-notifications/reminder-notifications.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, RouterLink, TranslatePipe, RouterLinkActive],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  userName = '';
  userPhotoURL = '';
  currentLanguage: SupportedLang;
  isSidebarOpen = false;
  isSidebarCollapsed = false;
  isMobile = false;

  private auth = inject(Auth);
  private router = inject(Router);
  private translation = inject(TranslationService);
  private reminderNotifications = inject(ReminderNotificationsService);

  constructor() {
    this.currentLanguage = this.translation.getLanguage();
    this.syncSidebarMode();
  }

  ngOnInit() {
    this.syncSidebarMode();
    onAuthStateChanged(this.auth, (user) => {
      // TODO: disable observer -> add subscription and unsubscribe it when onDestroy()
      if (user) {
        this.userName = user.displayName || this.translation.translate('sidebar.defaultUser');
        this.userPhotoURL = user.photoURL || 'assets/user_image_placeholder.svg';
        this.reminderNotifications.start(user.uid);
      } else {
        this.reminderNotifications.stop();
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

  @HostListener('window:resize')
  onWindowResize() {
    this.syncSidebarMode();
  }

  async logout() {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    if (this.isMobile) {
      this.isSidebarOpen = false;
    }
  }

  toggleSidebarCollapsed() {
    if (!this.isMobile) {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
  }

  private syncSidebarMode() {
    this.isMobile = window.innerWidth < 992;
    this.isSidebarOpen = !this.isMobile;

    if (this.isMobile) {
      this.isSidebarCollapsed = false;
    }
  }
}
