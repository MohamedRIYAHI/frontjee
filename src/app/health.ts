import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Health {

  readonly API_URL = environment.apiUrls.health;
  readonly ENDPOINT = '/api/health';
  constructor(private httpClient: HttpClient) {

  }
  getHealth() {
    return this.httpClient.get(`${this.API_URL}${this.ENDPOINT}`);
  }
}