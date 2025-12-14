import { Component, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

type AuthMode = 'login' | 'register';
type GoalType = 'lose' | 'gain';

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthComponent {
  authForm: FormGroup;
  goalForm: FormGroup;
  
  currentStep = signal<'auth' | 'goal'>('auth');
  authMode = signal<AuthMode>('login');
  selectedGoal = signal<GoalType | null>(null);
  isLoading = signal(false);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      name: ['']
    });

    this.goalForm = this.fb.group({
      goal: ['', Validators.required]
    });
  }

  toggleAuthMode(): void {
    const newMode = this.authMode() === 'login' ? 'register' : 'login';
    this.authMode.set(newMode);
    
    const nameControl = this.authForm.get('name');
    if (newMode === 'register') {
      nameControl?.setValidators([Validators.required, Validators.minLength(2)]);
    } else {
      nameControl?.clearValidators();
      nameControl?.setValue('');
    }
    nameControl?.updateValueAndValidity();
  }

  onAuthSubmit(): void {
    if (this.authForm.valid) {
      this.isLoading.set(true);
      
      // Simuler une authentification
      setTimeout(() => {
        this.isLoading.set(false);
        this.currentStep.set('goal');
        this.cdr.markForCheck();
      }, 1000);
    }
  }

  selectGoal(goal: GoalType): void {
    this.selectedGoal.set(goal);
    this.goalForm.patchValue({ goal });
  }

  onGoalSubmit(): void {
    if (this.goalForm.valid && this.selectedGoal()) {
      this.isLoading.set(true);
      
      // Simuler la sauvegarde de l'objectif
      setTimeout(() => {
        this.isLoading.set(false);
        // Rediriger vers le dashboard ou la page principale
        console.log('Objectif sélectionné:', this.selectedGoal());
        this.cdr.markForCheck();
        // this.router.navigate(['/dashboard']);
      }, 1000);
    }
  }

  goBack(): void {
    this.currentStep.set('auth');
    this.selectedGoal.set(null);
    this.goalForm.reset();
  }
}

