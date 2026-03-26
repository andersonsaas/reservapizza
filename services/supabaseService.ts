
import { createClient } from '@supabase/supabase-js';
import { Mesa, TableStatus, UserProfile, Reserva, Restaurante, ConfiguracaoRestaurante } from '../types';

// ==========================================================
// CONFIGURAÇÃO DO SUPABASE
// ==========================================================
const supabaseUrl: string = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey: string = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const isConfigured = supabaseUrl !== '' && supabaseAnonKey !== '';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key-not-configured'
);

// ==========================================================
// FUNÇÕES DE RESTAURANTES
// ==========================================================

export const getRestaurantes = async (): Promise<Restaurante[]> => {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('restaurantes')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao buscar restaurantes:', error);
    return [];
  }
  return data as Restaurante[];
};

export const getRestauranteBySlug = async (slug: string): Promise<Restaurante | null> => {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('restaurantes')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Erro ao buscar restaurante:', error);
    return null;
  }
  return data as Restaurante;
};

export const createRestaurante = async (restaurante: {
  nome: string;
  slug: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  cor_primaria?: string;
  cor_secundaria?: string;
}): Promise<Restaurante> => {
  const { data, error } = await supabase
    .from('restaurantes')
    .insert([{
      ...restaurante,
      criado_por: (await supabase.auth.getUser()).data.user?.id
    }])
    .select()
    .single();

  if (error) throw error;
  return data as Restaurante;
};

export const updateRestaurante = async (id: string, updates: Partial<Restaurante>): Promise<Restaurante> => {
  const { data, error } = await supabase
    .from('restaurantes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Restaurante;
};

export const deleteRestaurante = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('restaurantes')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ==========================================================
// FUNÇÕES DE MESAS (ATUALIZADAS)
// ==========================================================

export const getMesas = async (restauranteId?: string): Promise<Mesa[]> => {
  if (!isConfigured) return [];

  let query = supabase
    .from('mesas')
    .select('*')
    .order('numero', { ascending: true });

  if (restauranteId) {
    query = query.eq('restaurante_id', restauranteId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar mesas:', error);
    return [];
  }
  return data as Mesa[];
};

// ==========================================================
// FUNÇÕES DE RESERVAS (ATUALIZADAS)
// ==========================================================

export const getReservasByDate = async (date: string, restauranteId?: string): Promise<Reserva[]> => {
  if (!isConfigured) return [];

  let query = supabase
    .from('reservas')
    .select('*')
    .eq('data_reserva', date);

  if (restauranteId) {
    query = query.eq('restaurante_id', restauranteId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar reservas:', error);
    return [];
  }
  return data as Reserva[];
};

export const createReserva = async (reserva: {
  restaurante_id: string;
  mesa_id: string;
  nome_cliente: string;
  contato?: string;
  num_pessoas: number;
  data_reserva: string;
  hora_inicio: string;
}): Promise<void> => {
  const { error } = await supabase
    .from('reservas')
    .insert([{
      ...reserva,
      criado_por: (await supabase.auth.getUser()).data.user?.id
    }]);

  if (error) {
    console.error("Insert reserva error:", error);
    throw error;
  }

  const today = new Date().toISOString().split('T')[0];
  if (reserva.data_reserva === today) {
    await updateMesaStatus(reserva.mesa_id, 'reservada');
  }
};

// ==========================================================
// FUNÇÕES DE PERFIS (ATUALIZADAS)
// ==========================================================

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Erro ao buscar perfil do usuário:', error.message);
    return null;
  }
  return data as UserProfile;
};

export const getProfilesByRestaurante = async (restauranteId: string): Promise<UserProfile[]> => {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('restaurante_id', restauranteId)
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar perfis do restaurante:', error);
    return [];
  }
  return data as UserProfile[];
};

// ==========================================================
// FUNÇÕES DE CONFIGURAÇÕES (ATUALIZADAS)
// ==========================================================

export const getSistemaAtivo = async (restauranteId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('configuracoes_restaurante')
    .select('valor')
    .eq('restaurante_id', restauranteId)
    .eq('chave', 'sistema_ativo')
    .single();

  if (error) {
    console.error('Erro ao buscar configuração:', error);
    return false;
  }
  return data.valor === 'true';
};

export const updateSistemaAtivo = async (restauranteId: string, valor: boolean): Promise<void> => {
  const { error } = await supabase
    .from('configuracoes_restaurante')
    .upsert({
      restaurante_id: restauranteId,
      chave: 'sistema_ativo',
      valor: valor.toString()
    }, { onConflict: 'restaurante_id,chave' });

  if (error) throw error;
};

// ==========================================================
// FUNÇÕES EXISTENTES (MANTIDAS PARA COMPATIBILIDADE)
// ==========================================================

export const updateMesaStatus = async (mesaId: string, status: TableStatus) => {
  const { error } = await supabase
    .from('mesas')
    .update({ status })
    .eq('id', mesaId);

  if (error) throw error;
};

export const saveLoungeConfig = async (mesas: Mesa[]) => {
  const { error } = await supabase
    .from('mesas')
    .upsert(mesas);

  if (error) throw error;
};

// --- NOVAS FUNÇÕES DE PERFIL ---

export const updateUserProfileName = async (userId: string, fullName: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', userId);

  if (error) throw error;
};

export const updateUserEmail = async (newEmail: string) => {
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw error;
};

export const updateUserPassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
};

// --- FUNÇÕES DE ADMINISTRAÇÃO DE USUÁRIOS ---

export const getAllProfiles = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true });

  if (error) throw error;
  return data as UserProfile[];
};

export const updateUserRole = async (userId: string, role: 'operador' | 'admin_restaurante' | 'super_admin') => {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) throw error;
};

export const assignUserToRestaurante = async (userId: string, restauranteId: string | null) => {
  const { error } = await supabase
    .from('profiles')
    .update({ restaurante_id: restauranteId })
    .eq('id', userId);

  if (error) throw error;
};

// --- FUNÇÕES DE CONFIGURAÇÃO ---
// (mantido apenas o modelo multi-tenant com restauranteId)

// Use getSistemaAtivo(restauranteId) / updateSistemaAtivo(restauranteId, valor) acima.
