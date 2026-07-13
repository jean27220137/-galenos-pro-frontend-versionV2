import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SolicitudesListComponent } from './solicitudes-list.component';
import { Solicitud } from '../../../core/models/solicitud.model';

const base = (id: number, estado: string): Solicitud => ({
  id, nroSolicitud: `SOL-00000${id}`, farmaciaId: 2, almacenId: 1,
  farmaceuticoId: 1, fechaSolicitud: '2026-07-01', estado,
  detalles: [{ id: id * 10, medicamentoId: 1, cantidadSolicitada: 5 }]
});

describe('SolicitudesListComponent', () => {
  let fixture: ComponentFixture<SolicitudesListComponent>;
  let comp: SolicitudesListComponent;
  let http: HttpTestingController;

  const initWith = async (rol: string) => {
    localStorage.setItem('galenos_sesion', JSON.stringify({ userId: 1, rol, farmaciaId: 2, token: 'tok', expira: '2099-01-01' }));
    await TestBed.configureTestingModule({
      imports: [SolicitudesListComponent],
      providers: [
        provideZonelessChangeDetection(), provideHttpClient(),
        provideHttpClientTesting(), provideRouter([]),
        MessageService, ConfirmationService,
      ]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SolicitudesListComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => {
    try { http.verify(); } finally { localStorage.clear(); TestBed.resetTestingModule(); }
  });

  const flushInit = (sols: Solicitud[]) => {
    http.expectOne(r => r.url.includes('/medicamentos')).flush([]);
    http.expectOne(r => r.url.includes('/solicitudes')).flush(sols);
    fixture.detectChanges();
  };

  it('se crea como FARMACEUTICO y carga solicitudes', async () => {
    await initWith('FARMACEUTICO');
    flushInit([base(1, 'PENDIENTE'), base(2, 'DESPACHADA')]);
    expect(comp.solicitudes.length).toBe(2);
    expect(comp.esAdmin).toBe(false);
  });

  it('pendienteVerificar cuenta despachadas', async () => {
    await initWith('FARMACEUTICO');
    flushInit([base(1, 'DESPACHADA'), base(2, 'ENTREGADA')]);
    expect(comp.pendienteVerificar).toBe(1);
  });

  it('solicitudesFiltradas filtra por búsqueda', async () => {
    await initWith('FARMACEUTICO');
    flushInit([base(1, 'PENDIENTE'), base(2, 'ENTREGADA')]);
    comp.busqueda = 'SOL-000001';
    expect(comp.solicitudesFiltradas.length).toBe(1);
  });

  it('toggleRow expande fila y agrega a revisadas si no es DESPACHADA', async () => {
    await initWith('FARMACEUTICO');
    flushInit([base(1, 'PENDIENTE')]);
    const sol = comp.solicitudes[0];
    comp.toggleRow(sol);
    expect(comp.expandidos.has(sol.id)).toBe(true);
    expect(comp.revisadas.has(sol.id)).toBe(true);
  });

  it('toggleRow colapsa fila si ya está expandida', async () => {
    await initWith('FARMACEUTICO');
    flushInit([base(1, 'PENDIENTE')]);
    const sol = comp.solicitudes[0];
    comp.toggleRow(sol);
    comp.toggleRow(sol);
    expect(comp.expandidos.has(sol.id)).toBe(false);
  });

  it('toggleRow con DESPACHADA no agrega a revisadas al re-expandir', async () => {
    await initWith('FARMACEUTICO');
    flushInit([base(1, 'DESPACHADA')]);
    const sol = comp.solicitudes[0];
    comp.toggleRow(sol); // colapsa (auto-expandido por ngOnInit)
    comp.revisadas.delete(sol.id);
    comp.toggleRow(sol); // re-expande, estado=DESPACHADA → no debe agregar a revisadas
    expect(comp.revisadas.has(sol.id)).toBe(false);
  });

  it('toggleRechazo activa y desactiva el formulario de rechazo', async () => {
    await initWith('FARMACEUTICO');
    flushInit([base(1, 'DESPACHADA')]);
    const sol = comp.solicitudes[0];
    comp.toggleRechazo(sol);
    expect(comp.rechazando[sol.id]).toBe(true);
    comp.toggleRechazo(sol);
    expect(comp.rechazando[sol.id]).toBe(false);
  });

  it('recibidoCheck y toggleCheck manejan checkboxes', async () => {
    await initWith('FARMACEUTICO');
    flushInit([base(1, 'DESPACHADA')]);
    expect(comp.recibidoCheck(1, 10)).toBe(false);
    comp.toggleCheck(1, 10);
    expect(comp.recibidoCheck(1, 10)).toBe(true);
    comp.toggleCheck(1, 10);
    expect(comp.recibidoCheck(1, 10)).toBe(false);
  });

  it('cantRevisados y porcentajeRevisados calculan correctamente', async () => {
    await initWith('FARMACEUTICO');
    flushInit([base(1, 'DESPACHADA')]);
    const sol = comp.solicitudes[0];
    comp.toggleCheck(sol.id, sol.detalles[0].id!);
    expect(comp.cantRevisados(sol)).toBe(1);
    expect(comp.porcentajeRevisados(sol)).toBe(100);
  });

  it('todosRevisados retorna false con detalles vacíos', async () => {
    await initWith('FARMACEUTICO');
    flushInit([{ ...base(1, 'DESPACHADA'), detalles: [] }]);
    expect(comp.todosRevisados(comp.solicitudes[0])).toBe(false);
  });

  it('porcentajeRevisados retorna 0 con detalles vacíos', async () => {
    await initWith('FARMACEUTICO');
    flushInit([{ ...base(1, 'DESPACHADA'), detalles: [] }]);
    expect(comp.porcentajeRevisados(comp.solicitudes[0])).toBe(0);
  });

  it('confirmarRecepcion sin todos revisados retorna', async () => {
    await initWith('FARMACEUTICO');
    flushInit([base(1, 'DESPACHADA')]);
    const sol = comp.solicitudes[0];
    comp.confirmarRecepcion(sol);
    http.expectNone(r => r.url.includes('/confirmar'));
  });

  it('nombreMed retorna nombre o ID', async () => {
    await initWith('FARMACEUTICO');
    flushInit([]);
    expect(comp.nombreMed(99)).toContain('#99');
  });

  it('nombreMed retorna nombre cuando medicamento existe', async () => {
    await initWith('FARMACEUTICO');
    http.expectOne(r => r.url.includes('/medicamentos'))
        .flush([{ id: 1, codigoSismed: 'M001', nombre: 'Amoxicilina',
                  presentacion: 'Cápsula', concentracion: '500mg',
                  viaAdministracion: 'Oral', stockMinimo: 10, activo: 1 }]);
    http.expectOne(r => r.url.includes('/solicitudes')).flush([]);
    fixture.detectChanges();
    expect(comp.nombreMed(1)).toContain('Amoxicilina');
  });

  it('JEFE_FARMACIA se detecta correctamente', async () => {
    await initWith('JEFE_FARMACIA');
    flushInit([base(1, 'PENDIENTE')]);
    expect(comp.esJefeFarmacia).toBe(true);
  });

  it('ADMIN carga todas las solicitudes con forkJoin de estados', async () => {
    await initWith('ADMIN');
    http.expectOne(r => r.url.includes('/medicamentos')).flush([]);
    const estados = ['PENDIENTE','APROBADO_JEFE','EN_PROCESO','DESPACHADA','ENTREGADA','CANCELADA','RECHAZADA'];
    estados.forEach(e => {
      http.expectOne(r => r.url.includes(`estado=${e}`)).flush([base(1, e)]);
    });
    expect(comp.esAdmin).toBe(true);
    expect(comp.solicitudes.length).toBe(7);
  });

  it('ADMIN con un estado fallido aplica catchError y omite ese estado', async () => {
    await initWith('ADMIN');
    http.expectOne(r => r.url.includes('/medicamentos')).flush([]);
    const estados = ['PENDIENTE','APROBADO_JEFE','EN_PROCESO','DESPACHADA','ENTREGADA','CANCELADA','RECHAZADA'];
    estados.forEach((e, i) => {
      const req = http.expectOne(r => r.url.includes(`estado=${e}`));
      if (i === 0) req.flush(null, { status: 500, statusText: 'Error' });
      else req.flush([base(2, e)]);
    });
    expect(comp.solicitudes.length).toBe(6);
  });

  it('confirmarAprobar llama PUT /aprobar al aceptar confirm', async () => {
    await initWith('JEFE_FARMACIA');
    flushInit([base(1, 'PENDIENTE')]);
    const confirmSvc = TestBed.inject(ConfirmationService);
    vi.spyOn(confirmSvc, 'confirm').mockImplementation((cfg: any) => cfg.accept());
    const sol = comp.solicitudes[0];
    comp.confirmarAprobar(sol);
    http.expectOne(r => r.url.includes('/solicitudes/1/aprobar') && r.method === 'PUT').flush(null);
    expect(sol.estado).toBe('APROBADO_JEFE');
  });

  it('confirmarAprobar muestra error si PUT /aprobar falla', async () => {
    await initWith('JEFE_FARMACIA');
    flushInit([base(1, 'PENDIENTE')]);
    const confirmSvc = TestBed.inject(ConfirmationService);
    vi.spyOn(confirmSvc, 'confirm').mockImplementation((cfg: any) => cfg.accept());
    comp.confirmarAprobar(comp.solicitudes[0]);
    http.expectOne(r => r.url.includes('/solicitudes/1/aprobar'))
        .flush({ error: 'Error' }, { status: 400, statusText: 'Error' });
    expect(comp.solicitudes[0].estado).toBe('PENDIENTE');
  });

  it('confirmarCancelar llama PUT /cancelar al aceptar', async () => {
    await initWith('FARMACEUTICO');
    flushInit([base(1, 'PENDIENTE')]);
    const confirmSvc = TestBed.inject(ConfirmationService);
    vi.spyOn(confirmSvc, 'confirm').mockImplementation((cfg: any) => cfg.accept());
    const sol = comp.solicitudes[0];
    comp.confirmarCancelar(sol);
    http.expectOne(r => r.url.includes('/solicitudes/1/cancelar')).flush(null);
    expect(sol.estado).toBe('CANCELADA');
  });

  it('confirmarCancelar muestra error si PUT /cancelar falla', async () => {
    await initWith('FARMACEUTICO');
    flushInit([base(1, 'PENDIENTE')]);
    const confirmSvc = TestBed.inject(ConfirmationService);
    vi.spyOn(confirmSvc, 'confirm').mockImplementation((cfg: any) => cfg.accept());
    comp.confirmarCancelar(comp.solicitudes[0]);
    http.expectOne(r => r.url.includes('/solicitudes/1/cancelar'))
        .flush({ error: 'Error' }, { status: 400, statusText: 'Error' });
    expect(comp.solicitudes[0].estado).toBe('PENDIENTE');
  });

  it('confirmarRecepcion con notaSalidaId confirma también la nota', async () => {
    await initWith('FARMACEUTICO');
    const solConNota: Solicitud = { ...base(1, 'DESPACHADA'), notaSalidaId: 99,
                                     detalles: [{ id: 10, medicamentoId: 1, cantidadSolicitada: 5 }] };
    flushInit([solConNota]);
    const sol = comp.solicitudes[0];
    vi.spyOn(comp, 'ngOnInit').mockImplementation(() => {});
    comp.toggleCheck(sol.id, 10);
    comp.confirmarRecepcion(sol);
    http.expectOne(r => r.url.includes('/solicitudes/1/entregar') && r.method === 'PUT').flush(null);
    http.expectOne(r => r.url.includes('/notas-salida/99/entregar')).flush(null);
  });

  it('confirmarRecepcion error HTTP muestra mensaje', async () => {
    await initWith('FARMACEUTICO');
    const sol = base(1, 'DESPACHADA');
    sol.detalles = [{ id: 10, medicamentoId: 1, cantidadSolicitada: 5 }];
    flushInit([sol]);
    comp.toggleCheck(1, 10);
    comp.confirmarRecepcion(comp.solicitudes[0]);
    http.expectOne(r => r.url.includes('/solicitudes/1/entregar') && r.method === 'PUT')
        .flush({ error: 'Error confirmar' }, { status: 500, statusText: 'Error' });
  });

  it('enviarRechazo sin motivo retorna sin enviar', async () => {
    await initWith('FARMACEUTICO');
    flushInit([base(1, 'DESPACHADA')]);
    comp.motivos[1] = '';
    comp.enviarRechazo(comp.solicitudes[0]);
    http.expectNone(r => r.url.includes('/rechazar'));
  });

  it('enviarRechazo con motivo llama PUT /rechazar', async () => {
    await initWith('FARMACEUTICO');
    flushInit([base(1, 'DESPACHADA')]);
    vi.spyOn(comp, 'ngOnInit').mockImplementation(() => {});
    comp.motivos[1] = 'Faltaron unidades';
    comp.enviarRechazo(comp.solicitudes[0]);
    http.expectOne(r => r.url.includes('/solicitudes/1/rechazar')).flush(null);
    expect(comp.rechazando[1]).toBe(false);
  });

  it('enviarRechazo muestra error si PUT /rechazar falla', async () => {
    await initWith('FARMACEUTICO');
    flushInit([base(1, 'DESPACHADA')]);
    comp.motivos[1] = 'Error';
    comp.enviarRechazo(comp.solicitudes[0]);
    http.expectOne(r => r.url.includes('/solicitudes/1/rechazar'))
        .flush({ error: 'Error rechazar' }, { status: 500, statusText: 'Error' });
    expect(comp.enviandoRechazo[1]).toBe(false);
  });

  it('catchError en medicamentos retorna lista vacía', async () => {
    await initWith('FARMACEUTICO');
    http.expectOne(r => r.url.includes('/medicamentos'))
        .flush(null, { status: 500, statusText: 'Error' });
    http.expectOne(r => r.url.includes('/solicitudes')).flush([base(1, 'PENDIENTE')]);
    fixture.detectChanges();
    expect(comp.solicitudes.length).toBe(1);
    expect(comp.medicamentos.length).toBe(0);
  });

  it('error callback en forkJoin cuando solicitudes falla', async () => {
    await initWith('FARMACEUTICO');
    http.expectOne(r => r.url.includes('/medicamentos')).flush([]);
    http.expectOne(r => r.url.includes('/solicitudes'))
        .flush(null, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(comp.cargando).toBe(false);
  });

  it('confirmarRecepcion sin notaSalidaId llama solo solicitudes/entregar', async () => {
    await initWith('FARMACEUTICO');
    const sol = { ...base(1, 'DESPACHADA'),
                  detalles: [{ id: 10, medicamentoId: 1, cantidadSolicitada: 5 }] };
    flushInit([sol]);
    vi.spyOn(comp, 'ngOnInit').mockImplementation(() => {});
    comp.toggleCheck(1, 10);
    comp.confirmarRecepcion(comp.solicitudes[0]);
    http.expectOne(r => r.url.includes('/solicitudes/1/entregar') && r.method === 'PUT').flush(null);
    http.expectNone(r => r.url.includes('/notas-salida'));
  });
});
