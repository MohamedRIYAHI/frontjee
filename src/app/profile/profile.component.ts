import { Component, signal, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProfileService, UserProfile } from './profile.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  private authUserId: number | null = null;
  private profileExists = signal(false);

  genderOptions = [
    { value: 'MALE', label: 'Homme' },
    { value: 'FEMALE', label: 'Femme' }
  ];

  activityLevelOptions = [
    { value: 'SEDENTARY', label: 'Sédentaire', description: 'Peu ou pas d\'exercice' },
    { value: 'LIGHTLY_ACTIVE', label: 'Légèrement actif', description: 'Exercice léger 1-3 jours/semaine' },
    { value: 'MODERATELY_ACTIVE', label: 'Modérément actif', description: 'Exercice modéré 3-5 jours/semaine' },
    { value: 'VERY_ACTIVE', label: 'Très actif', description: 'Exercice intense 6-7 jours/semaine' },
    { value: 'EXTRA_ACTIVE', label: 'Extrêmement actif', description: 'Exercice très intense, travail physique' }
  ];

  goalOptions = [
    { value: 'LOSE_WEIGHT', label: 'Perdre du poids', icon: '🔥' },
    { value: 'MAINTAIN', label: 'Maintenir le poids', icon: '⚖️' },
    { value: 'GAIN_MUSCLE', label: 'Prendre du muscle', icon: '💪' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private profileService: ProfileService,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      age: ['', [Validators.required, Validators.min(1), Validators.max(150)]],
      gender: ['', Validators.required],
      height: ['', [Validators.required, Validators.min(50), Validators.max(300)]],
      weight: ['', [Validators.required, Validators.min(20), Validators.max(500)]],
      activityLevel: ['', Validators.required],
      goal: ['', Validators.required],
      country: ['', [Validators.required, Validators.minLength(2)]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      avatarUrl: ['']
    });
  }

  ngOnInit(): void {
    // Vérifier si l'utilisateur est authentifié
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth']);
      return;
    }

    // Extraire l'ID utilisateur depuis le token JWT
    this.authUserId = this.authService.getUserId();
    
    if (!this.authUserId) {
      // Si on ne peut pas extraire l'ID, utiliser 1 par défaut (temporaire)
      console.warn('Impossible d\'extraire l\'ID utilisateur du token, utilisation de la valeur par défaut');
      this.authUserId = 1;
    }

    // Essayer de charger le profil existant
    this.loadProfile();
  }

  loadProfile(): void {
    if (!this.authUserId) {
      return;
    }
    
    this.isLoading.set(true);
    this.profileService.getProfile(this.authUserId).subscribe({
      next: (profile) => {
        // Le profil existe déjà - rediriger vers health-data
        // L'utilisateur ne devrait arriver ici que s'il n'a pas de profil
        // Mais au cas où, on redirige pour éviter de dupliquer le profil
        this.profileExists.set(true);
        this.authUserId = profile.authUserId || this.authUserId;
        console.log('Profil déjà existant, redirection vers health-data');
        this.router.navigate(['/health-data']);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        // Si le profil n'existe pas encore (404), c'est normal - on affiche le formulaire vide
        if (error.status === 404) {
          this.profileExists.set(false);
          console.log('Aucun profil trouvé, affichage du formulaire pour création');
        } else {
          console.error('Erreur lors du chargement du profil:', error);
        }
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onSubmit(): void {
    if (!this.authUserId) {
      this.errorMessage.set('ID utilisateur non disponible');
      return;
    }

    if (this.profileForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      const formValue = this.profileForm.value;
      const profileData: UserProfile = {
        authUserId: this.authUserId,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        age: Number(formValue.age),
        gender: formValue.gender,
        height: Number(formValue.height),
        weight: Number(formValue.weight),
        activityLevel: formValue.activityLevel,
        goal: formValue.goal,
        country: formValue.country,
        city: formValue.city,
        ...(formValue.avatarUrl && { avatarUrl: formValue.avatarUrl })
      };

      // Si le profil existe déjà, faire un PUT, sinon un POST
      const saveOperation = this.profileExists() 
        ? this.profileService.updateProfile(this.authUserId, profileData)
        : this.profileService.saveProfile(profileData);

      saveOperation.subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.profileExists.set(true);
          if (response.authUserId) {
            this.authUserId = response.authUserId;
          }
          this.successMessage.set('Profil enregistré avec succès !');
          this.cdr.markForCheck();
          
          // Rediriger vers la page de données de santé après 2 secondes
          setTimeout(() => {
            this.router.navigate(['/health-data']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading.set(false);
          // Si erreur 409 (Conflict) ou 23505 (violation de contrainte unique), essayer PUT
          if (error.status === 409 || (error?.error?.message?.includes('23505') || error?.error?.message?.includes('CONSTRAINT'))) {
            // Le profil existe déjà, faire un PUT
            this.profileService.updateProfile(this.authUserId!, profileData).subscribe({
              next: (response) => {
                this.isLoading.set(false);
                this.profileExists.set(true);
                if (response.authUserId) {
                  this.authUserId = response.authUserId;
                }
                this.successMessage.set('Profil mis à jour avec succès !');
                this.cdr.markForCheck();
                
                // Rediriger vers la page de données de santé après 2 secondes
                setTimeout(() => {
                  this.router.navigate(['/health-data']);
                }, 2000);
              },
              error: (updateError) => {
                this.isLoading.set(false);
                this.errorMessage.set(
                  updateError?.error?.message ||
                  updateError?.message ||
                  'Erreur lors de la mise à jour du profil. Veuillez réessayer.'
                );
                this.cdr.markForCheck();
              }
            });
          } else {
            this.errorMessage.set(
              error?.error?.message ||
              error?.message ||
              'Erreur lors de l\'enregistrement du profil. Veuillez réessayer.'
            );
            this.cdr.markForCheck();
          }
        }
      });
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (field?.hasError('minlength')) {
      return `Minimum ${field.errors?.['minlength'].requiredLength} caractères`;
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
