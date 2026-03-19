
export type TableStatus = 'livre' | 'ocupada' | 'reservada';
export type UserRole = 'operador' | 'super_admin';

export interface Mesa {
  id: string;
  numero: number;
  capacidade: number;
  status: TableStatus;
  cliente_nome?: string;
  num_pessoas?: number; // Quantidade de pessoas na reserva atual
  hora_reserva?: string;
}

export interface Reserva {
  id: string;
  mesa_id: string;
  nome_cliente: string;
  num_pessoas: number; // Campo obrigatório para a reserva
  data_reserva: string;
  hora_inicio: string;
  status: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  email?: string;
}
