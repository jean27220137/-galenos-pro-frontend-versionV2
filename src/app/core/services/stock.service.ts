import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Stock, EntradaStockRequest } from '../models/stock.model';

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/almacen/stock`;

  listarPorAlmacen(almacenId: number): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.base}?almacenId=${almacenId}`);
  }

  consultarDisponible(medicamentoId: number, almacenId: number): Observable<number> {
    return this.http.get<number>(`${this.base}/${medicamentoId}/disponible?almacenId=${almacenId}`);
  }

  registrarEntrada(dto: EntradaStockRequest): Observable<Stock> {
    return this.http.post<Stock>(`${this.base}/entrada`, dto);
  }
}
