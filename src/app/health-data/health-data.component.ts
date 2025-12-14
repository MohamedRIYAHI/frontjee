import { Component, signal, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HealthDataService, HealthData } from './health-data.service';
import { AuthService } from '../auth/auth.service';
import { ProfileService } from '../profile/profile.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-health-data',
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './health-data.component.html',
  styleUrl: './health-data.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HealthDataComponent implements OnInit {
  healthDataForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  private userId: number | null = null;

  dietTypeOptions = [
    { value: 'Vegan', label: 'Vegan' },
    { value: 'Vegetarian', label: 'Végétarien' },
    { value: 'Paleo', label: 'Paléo' },
    { value: 'Keto', label: 'Keto' },
    { value: 'Low-Carb', label: 'Low-Carb' },
    { value: 'Balanced', label: 'Équilibré' }
  ];

  workoutTypeOptions = [
    { value: 'Strength', label: 'Musculation', icon: '💪' },
    { value: 'HIIT', label: 'HIIT', icon: '⚡' },
    { value: 'Cardio', label: 'Cardio', icon: '🏃' },
    { value: 'Yoga', label: 'Yoga', icon: '🧘' }
  ];

  physicalExerciseLevelOptions = [
    { value: 1, label: 'Léger', description: 'Exercice léger' },
    { value: 2, label: 'Modéré', description: 'Exercice modéré' },
    { value: 3, label: 'Intense', description: 'Exercice intense' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private healthDataService: HealthDataService,
    private authService: AuthService,
    private profileService: ProfileService
  ) {
    // Initialiser la date à aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    
    this.healthDataForm = this.fb.group({
      date: [today, Validators.required],
      weight: ['', [Validators.required, Validators.min(20), Validators.max(500)]],
      caloriesConsumed: ['', [Validators.required, Validators.min(0)]],
      proteins: ['', [Validators.required, Validators.min(0)]],
      carbs: ['', [Validators.required, Validators.min(0)]],
      fats: ['', [Validators.required, Validators.min(0)]],
      dietType: ['', Validators.required],
      dailyMealsFrequency: ['', [Validators.required, Validators.min(1), Validators.max(10)]],
      caloriesBurned: ['', [Validators.required, Validators.min(0)]],
      steps: ['', [Validators.required, Validators.min(0)]],
      waterLitres: ['', [Validators.required, Validators.min(0), Validators.max(20)]],
      sessionDuration: ['', [Validators.required, Validators.min(0), Validators.max(24)]],
      workoutType: ['', Validators.required],
      physicalExerciseLevel: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Vérifier si l'utilisateur est authentifié
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth']);
      return;
    }

    // Extraire l'ID utilisateur depuis le token JWT
    this.userId = this.authService.getUserId();
    
    if (!this.userId) {
      console.warn('Impossible d\'extraire l\'ID utilisateur du token, utilisation de la valeur par défaut');
      this.userId = 1;
    }

    // Charger le profil pour pré-remplir les champs
    this.loadProfileData();
    // Essayer de charger les données d'aujourd'hui
    this.loadTodayData();
  }

  /**
   * Charger le profil utilisateur pour pré-remplir certains champs
   */
  loadProfileData(): void {
    if (!this.userId) {
      return;
    }

    this.profileService.getProfile(this.userId).subscribe({
      next: (profile) => {
        // Pré-remplir le poids depuis le profil si disponible
        if (profile.weight) {
          this.healthDataForm.patchValue({
            weight: profile.weight
          });
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        // Si le profil n'existe pas, ce n'est pas grave
        if (error.status !== 404) {
          console.error('Erreur lors du chargement du profil:', error);
        }
      }
    });
  }

  loadTodayData(): void {
    if (!this.userId) {
      return;
    }

    this.isLoading.set(true);
    this.healthDataService.getTodayHealthData(this.userId)
      .pipe(
        finalize(() => {
          // Garantir que isLoading est toujours réinitialisé
          this.isLoading.set(false);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data) => {
          this.healthDataForm.patchValue({
            ...data,
            date: data.date || new Date().toISOString().split('T')[0]
          });
          this.cdr.markForCheck();
        },
        error: (error) => {
          // Si les données n'existent pas encore (404), ce n'est pas une erreur
          if (error.status === 404) {
            // Pas de données pour aujourd'hui, c'est normal
          } else if (error.status === 0 || 
                     error.status === undefined ||
                     error.message?.includes('ERR_CONNECTION_REFUSED') ||
                     error.message?.includes('Failed to fetch') ||
                     error.message?.includes('NetworkError') ||
                     error.name === 'NetworkError' ||
                     error.name === 'TypeError') {
            // Le serveur n'est pas accessible
            console.warn('Le serveur backend n\'est pas accessible. Assurez-vous que le service health-data-service est démarré sur le port 8083.', {
              status: error.status,
              message: error.message,
              name: error.name,
              error: error
            });
          } else {
            console.error('Erreur lors du chargement des données:', error);
          }
        }
      });
  }

  onSubmit(): void {
    if (!this.userId) {
      this.errorMessage.set('ID utilisateur non disponible');
      return;
    }

    if (this.healthDataForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      const formValue = this.healthDataForm.value;
      const healthData: HealthData = {
        date: formValue.date,
        weight: Number(formValue.weight),
        caloriesConsumed: Number(formValue.caloriesConsumed),
        proteins: Number(formValue.proteins),
        carbs: Number(formValue.carbs),
        fats: Number(formValue.fats),
        dietType: formValue.dietType,
        dailyMealsFrequency: Number(formValue.dailyMealsFrequency),
        caloriesBurned: Number(formValue.caloriesBurned),
        steps: Number(formValue.steps),
        waterLitres: Number(formValue.waterLitres),
        sessionDuration: Number(formValue.sessionDuration),
        workoutType: formValue.workoutType,
        physicalExerciseLevel: Number(formValue.physicalExerciseLevel)
      };

      this.healthDataService.saveHealthData(this.userId, healthData)
        .pipe(
          finalize(() => {
            // Garantir que isLoading est toujours réinitialisé, même en cas d'erreur
            this.isLoading.set(false);
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: () => {
            this.successMessage.set('Données de santé enregistrées avec succès !');
            this.errorMessage.set(null);
            this.cdr.markForCheck();
          },
          error: (error) => {
            let errorMsg = 'Erreur lors de l\'enregistrement des données. Veuillez réessayer.';
            
            // Vérifier les erreurs de connexion réseau
            if (error.status === 0 || 
                error.status === undefined ||
                error.message?.includes('ERR_CONNECTION_REFUSED') ||
                error.message?.includes('Failed to fetch') ||
                error.message?.includes('NetworkError') ||
                error.name === 'NetworkError' ||
                error.name === 'TypeError') {
              errorMsg = 'Impossible de se connecter au serveur backend. Veuillez vérifier que le service health-data-service est démarré et accessible sur http://localhost:8083.';
              console.error('Erreur de connexion réseau:', {
                status: error.status,
                message: error.message,
                name: error.name,
                error: error
              });
            } else if (error.status === 401) {
              errorMsg = 'Votre session a expiré. Veuillez vous reconnecter.';
            } else if (error.status === 403) {
              errorMsg = 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.';
            } else if (error.status === 404) {
              errorMsg = 'La ressource demandée n\'a pas été trouvée.';
            } else if (error.status === 500) {
              errorMsg = 'Une erreur serveur s\'est produite. Veuillez réessayer plus tard.';
            } else if (error?.error?.message) {
              errorMsg = error.error.message;
            } else if (error?.message) {
              errorMsg = error.message;
            }
            
            this.errorMessage.set(errorMsg);
            this.cdr.markForCheck();
          }
        });
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.healthDataForm.controls).forEach(key => {
        this.healthDataForm.get(key)?.markAsTouched();
      });
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.healthDataForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (field?.hasError('min')) {
      return `La valeur minimale est ${field.errors?.['min'].min}`;
    }
    if (field?.hasError('max')) {
      return `La valeur maximale est ${field.errors?.['max'].max}`;
    }
    return '';
  }
}
