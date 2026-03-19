
import React, { useState } from 'react';
import { User, Mail, Lock, Save, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import { updateUserProfileName, updateUserEmail, updateUserPassword } from '../services/supabaseService';
import { toast } from 'react-hot-toast';

interface ProfileSettingsProps {
  user: UserProfile;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onProfileUpdate }) => {
  const [fullName, setFullName] = useState(user.full_name);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingName, setLoadingName] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingName(true);
    try {
      await updateUserProfileName(user.id, fullName);
      onProfileUpdate({ ...user, full_name: fullName });
      toast.success('Nome atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar nome.');
    } finally {
      setLoadingName(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoadingEmail(true);
    try {
      await updateUserEmail(email);
      toast.success('Link de confirmação enviado para o novo e-mail!');
      setEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar e-mail.');
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoadingPass(true);
    try {
      await updateUserPassword(password);
      toast.success('Senha atualizada com sucesso!');
      setPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar senha.');
    } finally {
      setLoadingPass(false);
    }
  };

  return (
    <div className="max-w-4xl animate-fade-in space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-white">Meu Perfil</h2>
        <p className="text-slate-400 mt-1">Gerencie suas informações pessoais e de segurança.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Nome do Usuário */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 text-rose-500">
            <User size={24} />
            <h3 className="text-lg font-bold text-white">Informações Pessoais</h3>
          </div>
          
          <form onSubmit={handleUpdateName} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Nome Completo</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 focus:ring-2 focus:ring-rose-500/50 outline-none transition-all text-slate-200"
                required
              />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">E-mail Atual</label>
               <div className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-4 text-slate-500 font-medium cursor-not-allowed">
                {user.email || 'Não informado'}
               </div>
            </div>
            <button 
              disabled={loadingName}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loadingName ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Salvar Alterações
            </button>
          </form>
        </div>

        {/* Segurança - Senha */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 text-amber-500">
            <ShieldCheck size={24} />
            <h3 className="text-lg font-bold text-white">Segurança</h3>
          </div>
          
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all text-slate-200 placeholder:text-slate-700"
                />
              </div>
            </div>
            <button 
              disabled={loadingPass || !password}
              className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loadingPass ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
              Alterar Senha
            </button>
          </form>
        </div>

        {/* E-mail */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 text-sky-500">
            <Mail size={24} />
            <h3 className="text-lg font-bold text-white">Alterar E-mail</h3>
          </div>
          
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 flex gap-3 text-sky-400">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-xs leading-relaxed">
              Ao alterar seu e-mail, o sistema enviará um link de confirmação para o novo endereço. 
              O acesso só será atualizado após você clicar no link enviado.
            </p>
          </div>

          <form onSubmit={handleUpdateEmail} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Novo E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="novo.email@exemplo.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 focus:ring-2 focus:ring-sky-500/50 outline-none transition-all text-slate-200 placeholder:text-slate-700"
              />
            </div>
            <button 
              disabled={loadingEmail || !email}
              className="sm:mt-6 bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 border border-sky-500/20"
            >
              {loadingEmail ? <Loader2 className="animate-spin" size={20} /> : <Mail size={20} />}
              Atualizar E-mail
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
