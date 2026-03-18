import { Injectable } from '@angular/core';
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
    'sidebar.medicalRecords': 'Registros Médicos',
    'sidebar.calendar': 'Calendario',
    'sidebar.map': 'Mapa',
    'sidebar.finances': 'Finanzas',
    'sidebar.logout': 'Cerrar Sesión',
    'sidebar.language': 'Idioma',
    'sidebar.lang.es': 'Español',
    'sidebar.lang.en': 'English',

    'login.title': 'PDIGS',
    'login.subtitle': 'Gestiona a tus mascotas en un solo lugar.',
    'login.signIn': 'Iniciar Sesión',
    'login.register': 'Registrarse',
    'login.email': 'Email',
    'login.password': 'Contraseña',
    'login.haveAccount': '¿Ya tienes cuenta?',
    'login.noAccount': '¿No tienes cuenta?',

    'pets.title': 'Mis Mascotas',
    'pets.subtitle': 'Gestiona la información de tus mascotas y consulta datos rápidos.',
    'pets.create': 'Crear Mascota',
    'pets.save': 'Guardar',
    'pets.cancel': 'Cancelar',
    'pets.view': 'Ver',
    'pets.edit': 'Editar',
    'pets.delete': 'Eliminar',

    'diets.title': 'Dietas de Mascotas',
    'diets.subtitle': 'Gestiona planes de alimentación por mascota.',
    'diets.selectPet': 'Seleccionar Mascota',
    'diets.forPet': 'Dietas para',
    'diets.create': 'Crear Dieta',
    'diets.save': 'Guardar',
    'diets.cancel': 'Cancelar',

    'diary.title': 'Diario de Mascotas',
    'diary.subtitle': 'Registra y revisa las actividades y eventos de tus mascotas.',
    'diary.selectPet': 'Seleccionar Mascota',
    'diary.forPet': 'Diario de',
    'diary.newEntry': 'Nueva Entrada',
    'diary.save': 'Guardar',
    'diary.cancel': 'Cancelar',
    'diary.view': 'Ver',
    'diary.edit': 'Editar',
    'diary.delete': 'Eliminar',

    'calendar.title': 'Calendario de Eventos',
    'calendar.subtitle': 'Eventos del diario de tus mascotas',

    'map.title': 'Mapa de tu Zona',
    'map.subtitle': 'Ubicación actual o zona por defecto.',

    'form.name': 'Nombre',
    'form.type': 'Tipo',
    'form.age': 'Edad',
    'form.breed': 'Raza',
    'form.date': 'Fecha',
    'form.title': 'Título',
    'form.description': 'Descripción',
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
    'sidebar.lang.es': 'Español',
    'sidebar.lang.en': 'English',

    'login.title': 'PDIGS',
    'login.subtitle': 'Manage your pets in one place.',
    'login.signIn': 'Sign In',
    'login.register': 'Register',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.haveAccount': 'Already have an account?',
    'login.noAccount': "Don't have an account?",

    'pets.title': 'My Pets',
    'pets.subtitle': 'Manage your pets information and quick facts.',
    'pets.create': 'Create Pet',
    'pets.save': 'Save',
    'pets.cancel': 'Cancel',
    'pets.view': 'View',
    'pets.edit': 'Edit',
    'pets.delete': 'Delete',

    'diets.title': 'Pet Diets',
    'diets.subtitle': 'Manage meal plans per pet.',
    'diets.selectPet': 'Select Pet',
    'diets.forPet': 'Diets for',
    'diets.create': 'Create Diet',
    'diets.save': 'Save',
    'diets.cancel': 'Cancel',

    'diary.title': 'Pet Diary',
    'diary.subtitle': 'Record and review your pets activities.',
    'diary.selectPet': 'Select Pet',
    'diary.forPet': 'Diary of',
    'diary.newEntry': 'New Entry',
    'diary.save': 'Save',
    'diary.cancel': 'Cancel',
    'diary.view': 'View',
    'diary.edit': 'Edit',
    'diary.delete': 'Delete',

    'calendar.title': 'Events Calendar',
    'calendar.subtitle': 'Your pets diary events',

    'map.title': 'Your Area Map',
    'map.subtitle': 'Current location or default area.',

    'form.name': 'Name',
    'form.type': 'Type',
    'form.age': 'Age',
    'form.breed': 'Breed',
    'form.date': 'Date',
    'form.title': 'Title',
    'form.description': 'Description',
  }
};

const STORAGE_KEY = 'pdigs_lang';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private lang$ = new BehaviorSubject<SupportedLang>(this.getSavedLang());

  setLanguage(lang: SupportedLang) {
    this.lang$.next(lang);
    localStorage.setItem(STORAGE_KEY, lang);
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
}
