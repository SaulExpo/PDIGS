import { Injectable, inject } from '@angular/core';
import Swal from 'sweetalert2';
import { TranslationService } from '../../i18n/translation.service';

type CrudAction = 'create' | 'update' | 'delete';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private translation = inject(TranslationService);

  async confirmDelete(entityName: string): Promise<boolean> {
    const isEnglish = this.translation.getLanguage() === 'en';
    const result = await Swal.fire({
      title: isEnglish ? 'Are you sure?' : '¿Estas seguro?',
      text: isEnglish
        ? `This will permanently delete the ${entityName}.`
        : `Esto eliminara de forma permanente ${this.withArticle(entityName)}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: isEnglish ? 'Yes, delete' : 'Si, eliminar',
      cancelButtonText: isEnglish ? 'Cancel' : 'Cancelar'
    });

    return result.isConfirmed;
  }

  success(action: CrudAction, entityName: string) {
    const isEnglish = this.translation.getLanguage() === 'en';
    const actionText = {
      create: isEnglish ? 'created' : 'creado',
      update: isEnglish ? 'updated' : 'actualizado',
      delete: isEnglish ? 'deleted' : 'eliminado'
    }[action];

    const title = isEnglish
      ? `${this.capitalize(entityName)} ${actionText} successfully.`
      : `${this.capitalize(entityName)} ${actionText} correctamente.`;

    return this.toast('success', title);
  }

  error(action: CrudAction | 'save' | 'export', entityName: string) {
    const isEnglish = this.translation.getLanguage() === 'en';
    const actionText = {
      create: isEnglish ? 'creating' : 'crear',
      update: isEnglish ? 'updating' : 'actualizar',
      delete: isEnglish ? 'deleting' : 'eliminar',
      save: isEnglish ? 'saving' : 'guardar',
      export: isEnglish ? 'exporting' : 'exportar'
    }[action];

    const title = isEnglish
      ? `There was an error ${actionText} the ${entityName}.`
      : `Ha ocurrido un error al ${actionText} ${this.withArticle(entityName)}.`;

    return this.toast('error', title, 3500);
  }

  validation(messageEs: string, messageEn: string) {
    return this.toast(
      'warning',
      this.translation.getLanguage() === 'en' ? messageEn : messageEs,
      3000
    );
  }

  private toast(icon: 'success' | 'error' | 'warning', title: string, timer = 2200) {
    return Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title,
      showConfirmButton: false,
      timer,
      timerProgressBar: true
    });
  }

  private withArticle(entityName: string) {
    const lower = entityName.toLowerCase();
    return /^(el|la|los|las|un|una)\s/.test(lower) ? entityName : `el ${entityName}`;
  }

  private capitalize(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
