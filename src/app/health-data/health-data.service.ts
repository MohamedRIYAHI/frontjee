import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

export interface HealthData {
  userId?: number;
  date?: string;
  weight: number;
  caloriesConsumed: number;
  proteins: number;
  carbs: number;
  fats: number;
  dietType: string;
  dailyMealsFrequency: number;
  caloriesBurned: number;
  steps: number;
  waterLitres: number;
  sessionDuration: number;
  workoutType: string;
  physicalExerciseLevel: number;
}

@Injectable({
  providedIn: 'root'
})
export class HealthDataService {
  private readonly API_URL = environment.apiUrls.healthData;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Obtenir les en-têtes HTTP avec le token d'authentification
   */
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  /**
   * Sauvegarder les données de santé du jour
   */
  saveHealthData(userId: number, healthData: HealthData): Observable<HealthData> {
    return this.http.post<HealthData>(
      `${this.API_URL}/api/health/${userId}`,
      healthData,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de la sauvegarde des données de santé:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupérer les données de santé d'aujourd'hui
   */
  getTodayHealthData(userId: number): Observable<HealthData> {
    return this.http.get<HealthData>(
      `${this.API_URL}/api/health/${userId}/today`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des données de santé:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupérer l'historique des données de santé
   */
  getHealthDataHistory(userId: number): Observable<HealthData[]> {
    return this.http.get<HealthData[]>(
      `${this.API_URL}/api/health/${userId}/history`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtenir la prédiction des calories brûlées
   */
  getCaloriesBurnedPrediction(userId: number): Observable<any> {
    const recommendationsApiUrl = 'http://localhost:8084';
    return this.http.get<any>(
      `${recommendationsApiUrl}/api/recommendations/${userId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération de la prédiction:', error);
        return throwError(() => error);
      })
    );
  }
}
