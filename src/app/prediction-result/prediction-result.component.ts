import { Component, signal, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HealthDataService } from '../health-data/health-data.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-prediction-result',
  imports: [RouterModule, CommonModule],
  templateUrl: './prediction-result.component.html',
  styleUrl: './prediction-result.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PredictionResultComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private healthDataService = inject(HealthDataService);
  private authService = inject(AuthService);

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  predictionResult = signal<number | null>(null);
  private userId: number | null = null;

  ngOnInit(): void {
    // Vérifier si l'utilisateur est authentifié
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth']);
      return;
    }

    // Extraire l'ID utilisateur depuis le token JWT
    this.userId = this.authService.getUserId();
    
    if (!this.userId) {
      this.errorMessage.set('ID utilisateur non disponible');
      this.isLoading.set(false);
      this.cdr.markForCheck();
      return;
    }

    // Vérifier si une prédiction est passée en paramètre
    const routePrediction = this.route.snapshot.queryParams['prediction'];
    if (routePrediction) {
      this.predictionResult.set(Number(routePrediction));
      this.isLoading.set(false);
      this.cdr.markForCheck();
    } else {
      // Sinon, faire une nouvelle prédiction
      this.loadPrediction();
    }
  }

  loadPrediction(): void {
    if (!this.userId) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.healthDataService.getCaloriesBurnedPrediction(this.userId)
      .subscribe({
        next: (response) => {
          try {
            // Log pour déboguer la structure de la réponse
            console.log('Réponse de l\'API:', response);
            console.log('Type de la réponse:', typeof response);
            
            // Gérer différentes structures de réponse possibles
            let calories: number | null = null;
            
            if (typeof response === 'number') {
              calories = response;
            } else if (typeof response === 'string') {
              // Si c'est une chaîne, essayer de la convertir en nombre
              const parsed = parseFloat(response);
              if (!isNaN(parsed)) {
                calories = parsed;
              }
            } else if (response && typeof response === 'object') {
              // Chercher dans différentes propriétés possibles
              if (response.caloriesBurned !== undefined && response.caloriesBurned !== null) {
                calories = Number(response.caloriesBurned);
              } else if (response.prediction !== undefined && response.prediction !== null) {
                calories = Number(response.prediction);
              } else if (response.value !== undefined && response.value !== null) {
                calories = Number(response.value);
              } else if (response.data !== undefined && response.data !== null) {
                // Si la réponse est dans une propriété data
                if (typeof response.data === 'number') {
                  calories = response.data;
                } else if (response.data.caloriesBurned !== undefined) {
                  calories = Number(response.data.caloriesBurned);
                } else if (response.data.prediction !== undefined) {
                  calories = Number(response.data.prediction);
                }
              } else {
                // Essayer de trouver une valeur numérique dans l'objet
                const values = Object.values(response);
                for (const value of values) {
                  if (typeof value === 'number' && !isNaN(value)) {
                    calories = value;
                    break;
                  } else if (typeof value === 'string') {
                    const parsed = parseFloat(value);
                    if (!isNaN(parsed)) {
                      calories = parsed;
                      break;
                    }
                  }
                }
              }
            }
            
            // Vérifier si on a trouvé une valeur valide
            if (calories === null || isNaN(calories)) {
              console.error('Format de réponse inattendu:', response);
              this.errorMessage.set('Format de réponse inattendu du service de prédiction. Réponse reçue: ' + JSON.stringify(response));
              this.isLoading.set(false);
              this.cdr.markForCheck();
              return;
            }
            
            const roundedCalories = Math.round(calories);
            console.log('Calories calculées:', roundedCalories);
            this.predictionResult.set(roundedCalories);
            this.isLoading.set(false);
            this.cdr.markForCheck();
          } catch (error) {
            console.error('Erreur lors du traitement de la réponse:', error);
            this.errorMessage.set('Erreur lors du traitement de la réponse: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
            this.isLoading.set(false);
            this.cdr.markForCheck();
          }
        },
        error: (error) => {
          let errorMsg = 'Erreur lors de la prédiction. Veuillez réessayer.';
          
          if (error.status === 0 || 
              error.status === undefined ||
              error.message?.includes('ERR_CONNECTION_REFUSED') ||
              error.message?.includes('Failed to fetch') ||
              error.message?.includes('NetworkError') ||
              error.name === 'NetworkError' ||
              error.name === 'TypeError') {
            errorMsg = 'Impossible de se connecter au service de prédiction. Veuillez vérifier que le service recommendations est démarré sur le port 8084.';
          } else if (error?.error?.message) {
            errorMsg = error.error.message;
          } else if (error?.message) {
            errorMsg = error.message;
          }
          
          this.errorMessage.set(errorMsg);
          this.isLoading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/health-data']);
  }

  retryPrediction(): void {
    this.loadPrediction();
  }

  getCurrentDate(): string {
    const today = new Date();
    return today.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}

