import { Component, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';
import { ProfileService } from '../profile/profile.service';

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
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private profileService: ProfileService
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
    this.errorMessage.set(null);
    
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
      this.errorMessage.set(null);
      
      const formValue = this.authForm.value;
      
      if (this.authMode() === 'login') {
        // Connexion
        this.authService.login({
          email: formValue.email,
          password: formValue.password
        }).subscribe({
          next: () => {
            this.isLoading.set(false);
            // Vérifier si le profil existe déjà
            this.checkProfileAndRedirect();
            this.cdr.markForCheck();
          },
          error: (error) => {
            this.isLoading.set(false);
            this.errorMessage.set(
              error?.error?.message || 
              error?.message || 
              'Erreur de connexion. Vérifiez vos identifiants.'
            );
            this.cdr.markForCheck();
          }
        });
      } else {
        // Inscription - vérifier si le profil existe déjà, sinon rediriger vers le profil
        this.authService.register({
          name: formValue.name,
          email: formValue.email,
          password: formValue.password
        }).subscribe({
          next: () => {
            this.isLoading.set(false);
            // Vérifier si le profil existe déjà (peut arriver si l'utilisateur s'est déjà inscrit)
            this.checkProfileAndRedirect();
            this.cdr.markForCheck();
          },
          error: (error) => {
            this.isLoading.set(false);
            this.errorMessage.set(
              error?.error?.message || 
              error?.message || 
              'Erreur d\'inscription. Veuillez réessayer.'
            );
            this.cdr.markForCheck();
          }
        });
      }
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

  /**
   * Vérifier si le profil existe et rediriger :
   * - Si le profil existe → rediriger vers health-data
   * - Si le profil n'existe pas → rediriger vers profile pour le compléter
   */
  private checkProfileAndRedirect(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      // Si on ne peut pas extraire l'ID depuis le token, rediriger vers le profil
      console.warn('Impossible d\'extraire l\'ID utilisateur du token');
      this.router.navigate(['/profile']);
      return;
    }

    this.profileService.getProfile(userId).subscribe({
      next: (profile) => {
        // Le profil existe déjà, récupérer les données et rediriger vers health-data
        console.log('Profil trouvé, redirection vers health-data');
        this.router.navigate(['/health-data']);
      },
      error: (error) => {
        // Si le profil n'existe pas (404), rediriger vers le formulaire de profil
        if (error.status === 404) {
          console.log('Profil non trouvé, redirection vers profile pour compléter');
          this.router.navigate(['/profile']);
        } else {
          // En cas d'autre erreur (erreur réseau, serveur, etc.), rediriger vers le profil
          console.error('Erreur lors de la vérification du profil:', error);
          this.router.navigate(['/profile']);
        }
      }
    });
  }
}

