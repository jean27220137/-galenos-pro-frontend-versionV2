export interface UsuarioSesion {
  userId: number;
  rol: string;
  farmaciaId?: number;
  token: string;
  expira: string;
}
