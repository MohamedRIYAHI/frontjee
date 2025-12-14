import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

export interface UserProfile {
  authUserId?: number;
  firstName: string;
  lastName: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  height: number;
  weight: number;
  activityLevel: 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';
  goal: 'LOSE_WEIGHT' | 'MAINTAIN' | 'GAIN_MUSCLE';
  country: string;
  city: string;
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly API_URL = environment.apiUrls.profile;

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
   * Créer le profil utilisateur
   */
  saveProfile(profile: UserProfile): Observable<UserProfile> {
    // S'assurer que authUserId est présent (utiliser 1 par défaut si non fourni)
    const profileData = {
      ...profile,
      authUserId: profile.authUserId || 1
    };
    
    return this.http.post<UserProfile>(
      `${this.API_URL}/profiles`,
      profileData,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de la sauvegarde du profil:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  getProfile(authUserId: number = 1): Observable<UserProfile> {
    return this.http.get<UserProfile>(
      `${this.API_URL}/profiles/${authUserId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération du profil:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  updateProfile(authUserId: number, profile: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(
      `${this.API_URL}/profiles/${authUserId}`,
      profile,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de la mise à jour du profil:', error);
        return throwError(() => error);
      })
    );
  }
}
