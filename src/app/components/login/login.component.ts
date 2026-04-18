import { Component, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { addDoc, collection, Firestore } from '@angular/fire/firestore';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  isLogin = true;
  authErrorMessage = '';
  isSubmitting = false;

  private auth = inject(Auth);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private translation = inject(TranslationService);

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  registerForm = new FormGroup({
    name: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    username: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  toggleForm() {
    this.isLogin = !this.isLogin;
    this.authErrorMessage = '';
    this.loginForm.markAsPristine();
    this.registerForm.markAsPristine();
  }

  async onLogin() {
    this.authErrorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.authErrorMessage = this.translation.translate('login.submitError');
      return;
    }

    try {
      this.isSubmitting = true;
      const {email, password} = this.loginForm.value;
      await signInWithEmailAndPassword(this.auth, email!, password!);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Login error:', error);
      this.authErrorMessage = this.getFirebaseErrorMessage(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  async onRegister() {
    this.authErrorMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.authErrorMessage = this.translation.translate('login.submitError');
      return;
    }

    try {
      this.isSubmitting = true;
      const {name, lastName, username, email, password} = this.registerForm.value;
      const userCredential = await createUserWithEmailAndPassword(this.auth, email!, password!);
      await updateProfile(userCredential.user, {
        displayName: `${name} ${lastName}`
      });
      const userDoc = {
        uid: userCredential.user.uid,
        email: email,
        name: name,
        lastName: lastName,
        username: username
      };
      await addDoc(collection(this.firestore, 'usuarios'), userDoc);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Registration error:', error);
      this.authErrorMessage = this.getFirebaseErrorMessage(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  getErrorMessage(formName: 'login' | 'register', controlName: string): string {
    const control = formName === 'login'
      ? this.loginForm.controls[controlName as keyof typeof this.loginForm.controls]
      : this.registerForm.controls[controlName as keyof typeof this.registerForm.controls];

    if (!control || !(control.touched || control.dirty) || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      const requiredKey: Record<string, string> = {
        name: 'login.nameRequired',
        lastName: 'login.lastNameRequired',
        username: 'login.usernameRequired',
        email: 'login.emailRequired',
        password: 'login.passwordRequired'
      };
      return this.translation.translate(requiredKey[controlName]);
    }

    if (control.errors['email']) {
      return this.translation.translate('login.emailInvalid');
    }

    if (control.errors['minlength']) {
      return this.translation.translate('login.passwordMinLength');
    }

    return '';
  }

  private getFirebaseErrorMessage(error: unknown): string {
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? String(error['code'])
      : '';

    const errorMap: Record<string, string> = {
      'auth/invalid-credential': 'login.invalidCredentials',
      'auth/invalid-email': 'login.emailInvalid',
      'auth/missing-password': 'login.passwordRequired',
      'auth/wrong-password': 'login.invalidCredentials',
      'auth/user-not-found': 'login.invalidCredentials',
      'auth/email-already-in-use': 'login.emailInUse',
      'auth/weak-password': 'login.weakPassword',
      'auth/network-request-failed': 'login.genericError',
      'auth/too-many-requests': 'login.genericError'
    };

    return this.translation.translate(errorMap[code] ?? 'login.genericError');
  }
}
