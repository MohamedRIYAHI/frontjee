import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Health {

  readonly API_URL = 'http://localhost:8080';
  readonly ENDPOINT = '/api/health';
  constructor(private httpClient: HttpClient) {

  }
  getHealth() {
    return this.httpClient.get(`${this.API_URL}${this.ENDPOINT}`);
  }
}