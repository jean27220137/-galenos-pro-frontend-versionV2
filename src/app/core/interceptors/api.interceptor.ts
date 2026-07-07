import { HttpInterceptorFn } from '@angular/common/http';

const SESSION_KEY = 'galenos_sesion';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return next(req);

  try {
    const sesion = JSON.parse(raw);
    const headers: Record<string, string> = {};

    if (sesion.token) {
      headers['Authorization'] = `Bearer ${sesion.token}`;
    }
    if (sesion.userId) {
      headers['X-User-Id'] = String(sesion.userId);
    }
    if (sesion.rol) {
      headers['X-User-Rol'] = sesion.rol;
    }

    return next(req.clone({ setHeaders: headers }));
  } catch {
    return next(req);
  }
};
