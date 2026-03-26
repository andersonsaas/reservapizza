
export type TableStatus = 'livre' | 'ocupada' | 'reservada';
export type UserRole = 'operador' | 'admin_restaurante' | 'super_admin';

export interface Restaurante {
  id: string;
  nome: string;
  slug: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  logo_url?: string;
  cor_primaria: string;
  cor_secundaria: string;
  criado_por?: string;
  criado_at: string;
  updated_at: string;
}

export interface Mesa {
  id: string;
  restaurante_id: string;
  numero: number;
  capacidade: number;
  status: TableStatus;
  cliente_nome?: string;
  num_pessoas?: number; // Quantidade de pessoas na reserva atual
  hora_reserva?: string;
}

export interface Reserva {
  id: string;
  restaurante_id: string;
  mesa_id: string;
  nome_cliente: string;
  contato?: string;
  num_pessoas: number; // Campo obrigatório para a reserva
  data_reserva: string;
  hora_inicio: string;
  status: string;
  criado_por?: string;
  criado_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  email?: string;
  restaurante_id?: string;
}

export interface ConfiguracaoRestaurante {
  id: string;
  restaurante_id: string;
  chave: string;
  valor: string;
  updated_at: string;
}
