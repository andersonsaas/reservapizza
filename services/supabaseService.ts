
import { createClient } from '@supabase/supabase-js';
import { Mesa, TableStatus, UserProfile, Reserva } from '../types';

// ==========================================================
// CONFIGURAÇÃO DO SUPABASE
// ==========================================================
const supabaseUrl: string = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey: string = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const isConfigured = supabaseUrl !== '' && supabaseAnonKey !== '';

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey
);

export const getMesas = async (): Promise<Mesa[]> => {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('mesas')
    .select('*')
    .order('numero', { ascending: true });
    
  if (error) {
    console.error('Erro ao buscar mesas:', error);
    return [];
  }
  return data as Mesa[];
};

export const getReservasByDate = async (date: string): Promise<Reserva[]> => {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('reservas')
    .select('*')
    .eq('data_reserva', date);
    
  if (error) {
    console.error('Erro ao buscar reservas:', error);
    return [];
  }
  return data as Reserva[];
};

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

export const createReserva = async (reserva: { mesa_id: string; nome_cliente: string; num_pessoas: number; data_reserva: string; hora_inicio: string }) => {
  const { error } = await supabase
    .from('reservas')
    .insert([reserva]);
    
  if (error) throw error;
  
  const today = new Date().toISOString().split('T')[0];
  if (reserva.data_reserva === today) {
    await updateMesaStatus(reserva.mesa_id, 'reservada');
  }
};

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

export const updateUserRole = async (userId: string, role: 'operador' | 'super_admin') => {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);
    
  if (error) throw error;
};

// --- FUNÇÕES DE CONFIGURAÇÃO ---

export const getSistemaAtivo = async (): Promise<boolean> => {
  const { data, error } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'sistema_ativo')
    .single();
    
  if (error) {
    console.error('Erro ao buscar configuração:', error);
    return false;
  }
  return data.valor;
};

export const updateSistemaAtivo = async (valor: boolean) => {
  const { error } = await supabase
    .from('configuracoes')
    .upsert({ chave: 'sistema_ativo', valor }, { onConflict: 'chave' });
    
  if (error) throw error;
};
