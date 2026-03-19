
import React, { useState } from 'react';
import { Crown, Lock, Mail, ChevronRight, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { supabase, getUserProfile } from '../services/supabaseService';
import { toast } from 'react-hot-toast';

interface AuthFormProps {
  onLogin: (profile: UserProfile) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowSetupGuide(false);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const profile = await getUserProfile(data.user.id);
        if (profile) {
          onLogin(profile);
        } else {
          toast.error("Perfil não encontrado no banco de dados.");
          await supabase.auth.signOut();
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erro de autenticação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in px-4">
      <div className="text-center mb-10">
        <div className="w-24 h-24 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all hover:scale-110 duration-500">
          <Crown className="text-white w-14 h-14" />
        </div>
        <div className="space-y-0">
          <h1 className="text-4xl font-black tracking-tighter text-white">RAINHA DAS</h1>
          <h2 className="text-2xl font-bold tracking-[0.4em] text-amber-500 -mt-1">PIZZAS</h2>
        </div>
        <p className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em] mt-4 opacity-60">
          Sistema de Reservas Profissional
        </p>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        {/* Decorativo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
        
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">E-mail de Acesso</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={20} />
              <input 
                type="email" 
                className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none transition-all placeholder:text-slate-800 text-slate-200 font-medium"
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Sua Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={20} />
              <input 
                type="password" 
                className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none transition-all placeholder:text-slate-800 text-slate-200"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full group relative overflow-hidden bg-amber-600 hover:bg-amber-500 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-xl shadow-black/40"
          >
            <span className="relative z-10 flex items-center gap-2 tracking-widest uppercase text-sm">
              {loading ? 'Aguarde...' : 'Entrar no Reino'}
              {!loading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </span>
          </button>
        </form>
      </div>
      
      <p className="text-center mt-10 text-[9px] text-slate-600 font-black uppercase tracking-[0.4em] opacity-40">
        RAINHA DAS PIZZAS &copy; 2024 • ROYAL MANAGEMENT
      </p>
    </div>
  );
};

export default AuthForm;
