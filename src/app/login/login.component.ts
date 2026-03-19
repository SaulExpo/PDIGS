
import { Component, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '../i18n/translate.pipe';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, TranslatePipe],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {
  isLogin = true;

  private auth = inject(Auth);
  private router = inject(Router);
  private firestore = inject(Firestore);

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required)
  });

  registerForm = new FormGroup({
    name: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    username: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required)
  });

  toggleForm() {
    this.isLogin = !this.isLogin;
  }

  async onLogin() {
    if (this.loginForm.valid) {
      try {
        const { email, password } = this.loginForm.value;
        await signInWithEmailAndPassword(this.auth, email!, password!);
        console.log('Login successful');
        this.router.navigate(['/dashboard']);
      } catch (error) {
        console.error('Login error:', error);
        // Show error message
      }
    }
  }

  async onRegister() {
    if (this.registerForm.valid) {
      try {
        const { name, lastName, username, email, password } = this.registerForm.value;
        const userCredential = await createUserWithEmailAndPassword(this.auth, email!, password!);
        await updateProfile(userCredential.user, {
          displayName: `${name} ${lastName}`
        });
        // Save user data to Firestore
        const userDoc = {
          uid: userCredential.user.uid,
          email: email,
          name: name,
          lastName: lastName,
          username: username
        };
        await addDoc(collection(this.firestore, 'usuarios'), userDoc);
        console.log('Registration successful');
        this.router.navigate(['/dashboard']);
      } catch (error) {
        console.error('Registration error:', error);
        // Show error message
      }
    }
  }
}
