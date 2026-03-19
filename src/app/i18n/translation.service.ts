
import { Inject, Injectable, DOCUMENT } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type SupportedLang = 'es' | 'en';

export interface Translations {
  [key: string]: string;
}

export interface AppTranslations {
  es: Translations;
  en: Translations;
}

const TRANSLATIONS: AppTranslations = {
  es: {
    'sidebar.pets': 'Mascotas',
    'sidebar.diets': 'Dietas',
    'sidebar.diary': 'Diario',
    'sidebar.medicalRecords': 'Registros medicos',
    'sidebar.calendar': 'Calendario',
    'sidebar.map': 'Mapa',
    'sidebar.finances': 'Finanzas',
    'sidebar.logout': 'Cerrar sesion',
    'sidebar.language': 'Idioma',
    'sidebar.lang.es': 'Espanol',
    'sidebar.lang.en': 'English',
    'sidebar.userPhotoAlt': 'Foto de usuario',
    'sidebar.defaultUser': 'Usuario',

    'login.title': 'PDIGS',
    'login.subtitle': 'Gestiona a tus mascotas en un solo lugar.',
    'login.loginTitle': 'Iniciar sesion',
    'login.loginButton': 'Entrar',
    'login.registerTitle': 'Crear cuenta',
    'login.registerButton': 'Registrarse',
    'login.registerLink': 'Registrate',
    'login.loginLink': 'Inicia sesion',
    'login.email': 'Email',
    'login.password': 'Contrasena',
    'login.name': 'Nombre',
    'login.lastName': 'Apellidos',
    'login.username': 'Nombre de usuario',
    'login.hasAccount': 'Ya tienes cuenta?',
    'login.noAccount': 'No tienes cuenta?',

    'pets.title': 'Mis mascotas',
    'pets.subtitle': 'Gestiona la informacion de tus mascotas y consulta datos rapidos.',
    'pets.create': 'Crear mascota',
    'pets.save': 'Guardar',
    'pets.cancel': 'Cancelar',
    'pets.view': 'Ver',
    'pets.edit': 'Editar',
    'pets.delete': 'Eliminar',
    'pets.createTitle': 'Crear nueva mascota',
    'pets.editTitle': 'Editar mascota',
    'pets.detailsTitle': 'Detalles de',
    'pets.petId': 'ID de mascota',
    'pets.owner': 'Dueno',
    'pets.close': 'Cerrar',
    'pets.ageYears': 'anos',
    'pets.actions': 'Acciones',

    'diets.title': 'Dietas de mascotas',
    'diets.subtitle': 'Gestiona planes de alimentacion por mascota.',
    'diets.selectPet': 'Seleccionar mascota',
    'diets.forPet': 'Dietas para',
    'diets.create': 'Crear dieta',
    'diets.save': 'Guardar',
    'diets.cancel': 'Cancelar',
    'diets.createTitle': 'Crear nueva dieta',
    'diets.editTitle': 'Editar dieta',
    'diets.nameLabel': 'Nombre de la dieta',
    'diets.descriptionLabel': 'Descripcion',
    'diets.actions': 'Acciones',

    'diary.title': 'Diario de mascotas',
    'diary.subtitle': 'Registra y revisa las actividades y eventos de tus mascotas.',
    'diary.selectPet': 'Seleccionar mascota',
    'diary.forPet': 'Diario de',
    'diary.newEntry': 'Nueva entrada',
    'diary.save': 'Guardar',
    'diary.cancel': 'Cancelar',
    'diary.view': 'Ver',
    'diary.edit': 'Editar',
    'diary.delete': 'Eliminar',
    'diary.createTitle': 'Nueva entrada en el diario',
    'diary.editTitle': 'Editar entrada',
    'diary.pet': 'Mascota',
    'diary.close': 'Cerrar',
    'diary.actions': 'Acciones',

    'calendar.title': 'Calendario de eventos',
    'calendar.subtitle': 'Eventos del diario de tus mascotas',
    'calendar.selectedDate': 'Fecha seleccionada',
    'calendar.event': 'Evento',
    'calendar.petFallback': 'Mascota',
    'calendar.description': 'Descripcion',

    'map.title': 'Mapa de tu zona',
    'map.subtitle': 'Ubicacion actual o zona por defecto.',

    'medical.title': 'Registros medicos',
    'medical.subtitle': 'Contenido de registros medicos proximamente.',

    'finances.title': 'Finanzas',
    'finances.subtitle': 'Contenido de finanzas proximamente.',

    'form.name': 'Nombre',
    'form.type': 'Tipo',
    'form.age': 'Edad',
    'form.breed': 'Raza',
    'form.date': 'Fecha',
    'form.title': 'Titulo',
    'form.description': 'Descripcion'
  },
  en: {
    'sidebar.pets': 'Pets',
    'sidebar.diets': 'Diets',
    'sidebar.diary': 'Diary',
    'sidebar.medicalRecords': 'Medical Records',
    'sidebar.calendar': 'Calendar',
    'sidebar.map': 'Map',
    'sidebar.finances': 'Finances',
    'sidebar.logout': 'Logout',
    'sidebar.language': 'Language',
    'sidebar.lang.es': 'Spanish',
    'sidebar.lang.en': 'English',
    'sidebar.userPhotoAlt': 'User photo',
    'sidebar.defaultUser': 'User',

    'login.title': 'PDIGS',
    'login.subtitle': 'Manage your pets in one place.',
    'login.loginTitle': 'Sign in',
    'login.loginButton': 'Log in',
    'login.registerTitle': 'Create account',
    'login.registerButton': 'Sign up',
    'login.registerLink': 'Sign up',
    'login.loginLink': 'Sign in',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.name': 'First name',
    'login.lastName': 'Last name',
    'login.username': 'Username',
    'login.hasAccount': 'Already have an account?',
    'login.noAccount': "Don't have an account?",

    'pets.title': 'My pets',
    'pets.subtitle': 'Manage your pets information and quick facts.',
    'pets.create': 'Create pet',
    'pets.save': 'Save',
    'pets.cancel': 'Cancel',
    'pets.view': 'View',
    'pets.edit': 'Edit',
    'pets.delete': 'Delete',
    'pets.createTitle': 'Create new pet',
    'pets.editTitle': 'Edit pet',
    'pets.detailsTitle': 'Details for',
    'pets.petId': 'Pet ID',
    'pets.owner': 'Owner',
    'pets.close': 'Close',
    'pets.ageYears': 'years',
    'pets.actions': 'Actions',

    'diets.title': 'Pet diets',
    'diets.subtitle': 'Manage meal plans per pet.',
    'diets.selectPet': 'Select pet',
    'diets.forPet': 'Diets for',
    'diets.create': 'Create diet',
    'diets.save': 'Save',
    'diets.cancel': 'Cancel',
    'diets.createTitle': 'Create new diet',
    'diets.editTitle': 'Edit diet',
    'diets.nameLabel': 'Diet name',
    'diets.descriptionLabel': 'Description',
    'diets.actions': 'Actions',

    'diary.title': 'Pet diary',
    'diary.subtitle': 'Record and review your pets activities.',
    'diary.selectPet': 'Select pet',
    'diary.forPet': 'Diary of',
    'diary.newEntry': 'New entry',
    'diary.save': 'Save',
    'diary.cancel': 'Cancel',
    'diary.view': 'View',
    'diary.edit': 'Edit',
    'diary.delete': 'Delete',
    'diary.createTitle': 'New diary entry',
    'diary.editTitle': 'Edit entry',
    'diary.pet': 'Pet',
    'diary.close': 'Close',
    'diary.actions': 'Actions',

    'calendar.title': 'Events calendar',
    'calendar.subtitle': 'Your pets diary events',
    'calendar.selectedDate': 'Selected date',
    'calendar.event': 'Event',
    'calendar.petFallback': 'Pet',
    'calendar.description': 'Description',

    'map.title': 'Your area map',
    'map.subtitle': 'Current location or default area.',

    'medical.title': 'Medical records',
    'medical.subtitle': 'Medical records content coming soon.',

    'finances.title': 'Finances',
    'finances.subtitle': 'Finance content coming soon.',

    'form.name': 'Name',
    'form.type': 'Type',
    'form.age': 'Age',
    'form.breed': 'Breed',
    'form.date': 'Date',
    'form.title': 'Title',
    'form.description': 'Description'
  }
};

const STORAGE_KEY = 'pdigs_lang';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private lang$ = new BehaviorSubject<SupportedLang>(this.getSavedLang());

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.applyDocumentLanguage(this.lang$.getValue());
  }

  setLanguage(lang: SupportedLang) {
    this.lang$.next(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    this.applyDocumentLanguage(lang);
  }

  getLanguage() {
    return this.lang$.getValue();
  }

  language$() {
    return this.lang$.asObservable();
  }

  translate(key: string): string {
    const lang = this.getLanguage();
    return TRANSLATIONS[lang][key] ?? key;
  }

  private getSavedLang(): SupportedLang {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLang | null;
    if (saved === 'en' || saved === 'es') {
      return saved;
    }
    return 'es';
  }

  private applyDocumentLanguage(lang: SupportedLang) {
    this.document.documentElement.lang = lang;
  }
}
