import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ProximoVencerItem, SolicitudPendienteItem, StockCriticoItem } from '../models/dashboard.models';
import { Stock } from '../models/stock.model';

@Injectable({ providedIn: 'root' })
export class AlmacenDashboardService {
  private readonly http      = inject(HttpClient);
  private readonly base      = `${environment.apiUrl}/api/almacen/dashboard`;
  private readonly stockBase = `${environment.apiUrl}/api/almacen/stock`;
  private readonly farmBase  = `${environment.apiUrl}/api/farmacia/solicitudes`;
  private readonly medBase   = `${environment.apiUrl}/api/almacen/medicamentos`;

  getStockCritico(): Observable<StockCriticoItem[]> {
    return this.http.get<StockCriticoItem[]>(`${this.base}/stock-critico`);
  }

  getProximosVencer(dias = 90): Observable<ProximoVencerItem[]> {
    const params = new HttpParams().set('dias', dias);
    return this.http.get<ProximoVencerItem[]>(`${this.base}/proximos-vencer`, { params });
  }

  getSolicitudesPendientes(): Observable<SolicitudPendienteItem[]> {
    const params = new HttpParams().set('estado', 'EN_PROCESO');
    return this.http.get<SolicitudPendienteItem[]>(this.farmBase, { params });
  }

  getVencidos(almacenId = 1): Observable<Stock[]> {
    const params = new HttpParams().set('almacenId', almacenId);
    return this.http.get<Stock[]>(this.stockBase, { params });
  }

  getTotalMedicamentos(): Observable<number> {
    return this.http.get<any[]>(this.medBase).pipe(map(list => list?.length ?? 0));
  }
}
