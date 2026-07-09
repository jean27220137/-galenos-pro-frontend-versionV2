export interface Farmacia {
  id:           number;
  codigo:       string;
  nombre:       string;
  tipo:         string;
  area:         string;
  ubicacion:    string;
  departamento: string;
  jefeId:       number | null;
  jefeNombre:   string;
  telefono:     string;
  activo:       number;
}

export interface FarmaciaRequest {
  codigo:       string;
  nombre:       string;
  tipo:         string;
  area:         string;
  ubicacion:    string;
  departamento: string;
  jefeId:       number | null;
  jefeNombre:   string;
  telefono:     string;
}
