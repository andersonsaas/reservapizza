
import React, { useState, useEffect } from 'react';
import { Users, Shield, ShieldAlert, RefreshCw, Mail, UserCheck, UserX, Building2, ChevronDown } from 'lucide-react';
import { UserProfile, Restaurante } from '../types';
import { getAllProfiles, updateUserRole, assignUserToRestaurante, getRestaurantes } from '../services/supabaseService';
import { toast } from 'react-hot-toast';

const UserManagement: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [profilesData, restaurantesData] = await Promise.all([
        getAllProfiles(),
        getRestaurantes()
      ]);
      setProfiles(profilesData);
      setRestaurantes(restaurantesData);
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignRestaurante = async (profile: UserProfile, restauranteId: string | null) => {
    try {
      await assignUserToRestaurante(profile.id, restauranteId);
      setProfiles(profiles.map(p => 
        p.id === profile.id ? { ...p, restaurante_id: restauranteId } : p
      ));
      toast.success('Restaurante atribuído com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atribuir restaurante.');
    }
  };

  const handleToggleRole = async (profile: UserProfile) => {
    const newRole = profile.role === 'super_admin' ? 'operador' : profile.role === 'operador' ? 'admin_restaurante' : 'operador';
    const roleNames = {
      'operador': 'Operador',
      'admin_restaurante': 'Admin Restaurante',
      'super_admin': 'Super Admin'
    };
    
    const confirmMsg = `Deseja alterar o cargo de ${profile.full_name} para ${roleNames[newRole]}?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      await updateUserRole(profile.id, newRole);
      setProfiles(profiles.map(p => p.id === profile.id ? { ...p, role: newRole } : p));
      toast.success('Cargo atualizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar cargo.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="animate-spin text-amber-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl animate-fade-in space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Gerenciamento de Usuários</h2>
          <p className="text-slate-400 mt-1">Visualize e gerencie as permissões de acesso ao sistema.</p>
        </div>
        <button 
          onClick={() => { setRefreshing(true); fetchData(); }}
          disabled={refreshing}
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl hover:bg-slate-800 text-slate-300 transition-all active:scale-95"
        >
          <RefreshCw size={18} className={`text-amber-500 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-xs font-black uppercase tracking-widest">Atualizar</span>
        </button>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Usuário</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">E-mail</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Restaurante</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Cargo</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${profile.role === 'super_admin' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-slate-700 shadow-slate-700/20'}`}>
                        {profile.full_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white">{profile.full_name}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">ID: {profile.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-300 font-medium">
                      <Mail size={14} className="text-slate-500" />
                      {profile.email || <span className="text-slate-600 italic">Não disponível</span>}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="relative">
                      <select
                        value={profile.restaurante_id || ''}
                        onChange={(e) => handleAssignRestaurante(profile, e.target.value || null)}
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none appearance-none pr-8"
                      >
                        <option value="">Nenhum restaurante</option>
                        {restaurantes.map((restaurante) => (
                          <option key={restaurante.id} value={restaurante.id}>
                            {restaurante.nome}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      profile.role === 'super_admin' 
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : profile.role === 'admin_restaurante'
                        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {profile.role === 'super_admin' ? <ShieldAlert size={12} /> : profile.role === 'admin_restaurante' ? <Building2 size={12} /> : <Shield size={12} />}
                      {profile.role === 'super_admin' ? 'Super Admin' : profile.role === 'admin_restaurante' ? 'Admin Rest.' : 'Operador'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleToggleRole(profile)}
                      className={`p-3 rounded-xl transition-all ${
                        profile.role === 'super_admin' 
                          ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white'
                          : profile.role === 'admin_restaurante'
                          ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white'
                          : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                      }`}
                      title={
                        profile.role === 'super_admin' 
                          ? 'Alterar para Operador' 
                          : profile.role === 'admin_restaurante'
                          ? 'Alterar para Super Admin'
                          : 'Alterar para Admin Restaurante'
                      }
                    >
                      {profile.role === 'super_admin' ? <UserX size={20} /> : profile.role === 'admin_restaurante' ? <ShieldAlert size={20} /> : <UserCheck size={20} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {profiles.length === 0 && (
          <div className="p-20 text-center">
            <Users size={48} className="mx-auto text-slate-700 mb-4 opacity-20" />
            <p className="text-slate-500 font-bold">Nenhum usuário encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
