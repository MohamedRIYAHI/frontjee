import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrls.auth;
  private readonly TOKEN_KEY = 'auth_token';
  
  private token = signal<string | null>(null);

  constructor(private http: HttpClient) {
    // Récupérer le token depuis le localStorage au démarrage
    const savedToken = this.getTokenFromStorage();
    if (savedToken) {
      this.token.set(savedToken);
    }
  }

  /**
   * Connexion de l'utilisateur
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap(response => {
        this.setToken(response.token);
      }),
      catchError(error => {
        console.error('Erreur de connexion:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, userData).pipe(
      tap(response => {
        this.setToken(response.token);
      }),
      catchError(error => {
        console.error('Erreur d\'inscription:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Déconnexion de l'utilisateur
   */
  logout(): void {
    this.token.set(null);
    this.removeTokenFromStorage();
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return this.token() !== null;
  }

  /**
   * Obtenir le token actuel
   */
  getToken(): string | null {
    return this.token();
  }

  /**
   * Définir le token et le sauvegarder
   */
  private setToken(token: string): void {
    this.token.set(token);
    this.saveTokenToStorage(token);
  }

  /**
   * Sauvegarder le token dans le localStorage
   */
  private saveTokenToStorage(token: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  /**
   * Récupérer le token depuis le localStorage
   */
  private getTokenFromStorage(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  /**
   * Supprimer le token du localStorage
   */
  private removeTokenFromStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  /**
   * Décoder le token JWT et extraire l'ID utilisateur
   */
  getUserId(): number | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      // Un JWT est composé de 3 parties : header.payload.signature
      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }

      // Décoder le payload (base64)
      const decodedPayload = JSON.parse(atob(payload));
      
      // Le backend stocke probablement l'ID dans 'sub' (subject) ou 'userId'
      // Vérifier d'abord 'userId', puis 'sub', puis 'id'
      const userId = decodedPayload.userId || decodedPayload.sub || decodedPayload.id;
      
      if (userId) {
        return typeof userId === 'number' ? userId : parseInt(userId, 10);
      }

      // Si aucun ID trouvé, retourner null
      return null;
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
  }
}
