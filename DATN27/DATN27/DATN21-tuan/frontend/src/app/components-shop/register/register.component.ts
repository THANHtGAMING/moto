import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [RouterModule, FormsModule, ReactiveFormsModule, CommonModule]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;

  constructor(private auth: AuthService, private router:Router) {
    this.registerForm = new FormGroup(
      {
        fullname: new FormControl('', [Validators.required, Validators.minLength(6)]),
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required, Validators.minLength(6)]),
        confirmPassword: new FormControl('', [Validators.required]),
      },
      { validators: this.passwordMatchValidator() }
    );
  }

  ngOnInit() {}

  passwordMatchValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const password = formGroup.get('password')?.value;
      const confirmPassword = formGroup.get('confirmPassword')?.value;
      return password && confirmPassword && password !== confirmPassword
        ? { mismatch: true }
        : null;
    };
  }

  onRegister() {
    if (this.registerForm.invalid) {
      alert('Dữ liệu không hợp lệ');
      return;
    }

    this.isLoading = true;
    // Backend expects fullName (or fullname), email, password
    const registerData = {
      fullName: this.registerForm.value.fullname,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password
    };

    this.auth.register(registerData).subscribe({
      next: (res: any) => {
        console.log("Register response:", res);
        if (res && res.message) {
          alert('Đăng ký thành công!');
          this.router.navigate(['/login']);
        } else {
          alert('Đăng ký thất bại!');
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error("Register error:", err);
        const errorMessage = err?.error?.message || "Đăng ký thất bại!";
        alert(errorMessage);
        this.isLoading = false;
      }
    });
  }

  togglePassword(field: string) {
    const input = document.getElementById(field) as HTMLInputElement;
    input.type = input.type === 'password' ? 'text' : 'password';
  }

  onGoogleLogin() {
    // Redirect to backend Google OAuth endpoint
    this.auth.loginWithGoogle();
  }

  onFacebookLogin() {
    // Redirect to backend Facebook OAuth endpoint
    this.auth.loginWithFacebook();
  }

}
