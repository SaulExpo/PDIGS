import { Component, HostListener, inject, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged, signOut, updateProfile } from '@angular/fire/auth';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { SupportedLang, TranslationService } from '../../i18n/translation.service';
import { AlertService } from '../../services/alert/alert.service';
import { CloudinaryService } from '../../services/cloudinary/cloudinary.service';
import { ReminderNotificationsService } from '../../services/reminder-notifications/reminder-notifications.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, RouterLink, TranslatePipe, RouterLinkActive, ReactiveFormsModule],
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
  showProfileModal = false;
  isSavingProfile = false;
  selectedProfilePhotoFile: File | null = null;
  profilePhotoPreviewUrl = '';

  profileForm = new FormGroup({
    displayName: new FormControl('', Validators.required),
    photoURL: new FormControl('')
  });

  private auth = inject(Auth);
  private router = inject(Router);
  private translation = inject(TranslationService);
  private reminderNotifications = inject(ReminderNotificationsService);
  private cloudinaryService = inject(CloudinaryService);
  private alertService = inject(AlertService);

  constructor() {
    this.currentLanguage = this.translation.getLanguage();
    this.syncSidebarMode();
  }

  openProfileModal() {
    this.clearSelectedProfilePhoto();
    this.profileForm.setValue({
      displayName: this.userName,
      photoURL: this.auth.currentUser?.photoURL || ''
    });
    this.showProfileModal = true;
  }

  closeProfileModal() {
    this.clearSelectedProfilePhoto();
    this.showProfileModal = false;
    this.profileForm.reset();
  }

  async onProfilePhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    this.clearSelectedProfilePhoto();

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      await this.alertService.validation('Selecciona un archivo de imagen.', 'Please select an image file.');
      input.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      await this.alertService.validation('La imagen debe ocupar 10 MB o menos.', 'The image must be 10 MB or smaller.');
      input.value = '';
      return;
    }

    this.selectedProfilePhotoFile = file;
    this.profilePhotoPreviewUrl = URL.createObjectURL(file);
  }

  async saveProfile() {
    if (this.profileForm.invalid || !this.auth.currentUser) {
      this.profileForm.markAllAsTouched();
      return;
    }

    let photoURL = this.profileForm.value.photoURL || this.auth.currentUser.photoURL || '';

    try {
      this.isSavingProfile = true;

      if (this.selectedProfilePhotoFile) {
        photoURL = await this.cloudinaryService.uploadImage(this.selectedProfilePhotoFile);
      }

      const displayName = this.profileForm.value.displayName!.trim();
      await updateProfile(this.auth.currentUser, {
        displayName,
        photoURL
      });

      this.userName = displayName;
      this.userPhotoURL = photoURL || 'assets/user_image_placeholder.svg';
      this.closeProfileModal();
      await this.alertService.success('update', 'perfil');
    } catch (error) {
      console.error('Error updating profile:', error);
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el perfil.';
      await this.alertService.validation(
        `No se pudo actualizar el perfil: ${message}`,
        `Could not update profile: ${message}`
      );
    } finally {
      this.isSavingProfile = false;
    }
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

  private clearSelectedProfilePhoto() {
    if (this.profilePhotoPreviewUrl) {
      URL.revokeObjectURL(this.profilePhotoPreviewUrl);
    }

    this.selectedProfilePhotoFile = null;
    this.profilePhotoPreviewUrl = '';
  }
}
