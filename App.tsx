
import React, { useState, useEffect, useMemo } from 'react';
import { Crown, LayoutDashboard, LogOut, SlidersHorizontal, Users, ShieldAlert, Calendar, RefreshCw, UserCircle, Power, Ticket, MessageCircle, Building2 } from 'lucide-react';
import TableMap from './components/TableMap';
import AuthForm from './components/AuthForm';
import LoungeConfig from './components/LoungeConfig';
import ProfileSettings from './components/ProfileSettings';
import UserManagement from './components/UserManagement';
import RestauranteManagement from './components/RestauranteManagement';
import { UserProfile, Mesa, Reserva, TableStatus, Restaurante } from './types';
import { Toaster, toast } from 'react-hot-toast';
import { supabase, getMesas, getUserProfile, saveLoungeConfig, isConfigured, getReservasByDate, getSistemaAtivo, updateSistemaAtivo, getRestaurantes, getRestauranteBySlug } from './services/supabaseService';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sistemaAtivo, setSistemaAtivo] = useState(false);
  const [togglingSistema, setTogglingSistema] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'config' | 'profile' | 'users' | 'restaurantes'>('dashboard');
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [restauranteSelecionado, setRestauranteSelecionado] = useState<Restaurante | null>(null);
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [showRestauranteSelector, setShowRestauranteSelector] = useState(false);

  const fetchInitialData = async (date?: string, restauranteId?: string) => {
    const targetDate = date || selectedDate;
    const targetRestauranteId = restauranteId || restauranteSelecionado?.id;

    if (!targetRestauranteId) return;

    try {
      const [mesasData, reservasData] = await Promise.all([
        getMesas(targetRestauranteId),
        getReservasByDate(targetDate, targetRestauranteId)
      ]);
      setMesas(mesasData);
      setReservas(reservasData);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    }
  };

  useEffect(() => {
    let authSubscription: any;
    let configChannel: any;
    let dataChannel: any;

    const initializeApp = async () => {
      if (!isConfigured) {
        setLoading(false);
        return;
      }

      try {
        // Tenta recuperar a sessão atual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Se houver erro de token inválido ou não encontrado, limpa TUDO
        if (sessionError) {
          const isRefreshTokenError = 
            sessionError.message.toLowerCase().includes('refresh_token') || 
            sessionError.message.toLowerCase().includes('not found') ||
            sessionError.message.toLowerCase().includes('invalid');

          if (isRefreshTokenError) {
            console.warn("Sessão inválida detectada, limpando dados locais...");
            await supabase.auth.signOut();
            // Limpa chaves do Supabase do localStorage para garantir
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-')) localStorage.removeItem(key);
            });
            setUser(null);
          } else {
            throw sessionError;
          }
        }

        if (session) {
          const profile = await getUserProfile(session.user.id);
          if (profile) {
            setUser({ ...profile, email: session.user.email });

            // Buscar restaurantes disponíveis
            const restaurantesData = await getRestaurantes(profile.role !== 'super_admin');
            setRestaurantes(restaurantesData);

            // Lógica de seleção de restaurante
            if (profile.role === 'super_admin') {
              // Super admin pode escolher qualquer restaurante ou gerenciar todos
              setShowRestauranteSelector(true);
            } else if (profile.restaurante_id) {
              // Usuário tem restaurante atribuído
              const restaurante = restaurantesData.find(r => r.id === profile.restaurante_id);
              if (restaurante) {
                if (!restaurante.ativo) {
                  toast.error('Restaurante atribuído está inativo. Contate o super admin.');
                  setShowRestauranteSelector(true);
                } else {
                  setRestauranteSelecionado(restaurante);
                  // Busca status inicial do sistema
                  const ativo = await getSistemaAtivo(restaurante.id);
                  setSistemaAtivo(ativo);
                  await fetchInitialData(selectedDate, restaurante.id);
                }
              } else {
                // Restaurante não encontrado, mostrar seletor
                setShowRestauranteSelector(true);
              }
            } else {
              // Usuário sem restaurante atribuído
              setShowRestauranteSelector(true);
            }
          }
        }

        // Escuta mudanças na autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            const profile = await getUserProfile(session.user.id);
            if (profile) {
              setUser({ ...profile, email: session.user.email });
              const restaurantesData = await getRestaurantes(profile.role !== 'super_admin');
              setRestaurantes(restaurantesData);

              if (profile.role === 'super_admin') {
                setShowRestauranteSelector(true);
              } else if (profile.restaurante_id) {
                const restaurante = restaurantesData.find(r => r.id === profile.restaurante_id);
                if (restaurante) {
                  setRestauranteSelecionado(restaurante);
                  const ativo = await getSistemaAtivo(restaurante.id);
                  setSistemaAtivo(ativo);
                }
              } else {
                setShowRestauranteSelector(true);
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setRestauranteSelecionado(null);
            setShowRestauranteSelector(false);
          }
        });
        authSubscription = subscription;

        configChannel = supabase
          .channel('db-realtime-config')
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'configuracoes_restaurante'
          }, (payload: any) => {
            if (payload.new && payload.new.chave === 'sistema_ativo' && payload.new.restaurante_id === restauranteSelecionado?.id) {
              setSistemaAtivo(payload.new.valor === 'true');
            }
          })
          .subscribe();

        dataChannel = supabase
          .channel('db-realtime-data')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, (payload: any) => {
            if (payload.new?.restaurante_id === restauranteSelecionado?.id || payload.old?.restaurante_id === restauranteSelecionado?.id) {
              fetchInitialData();
            }
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, (payload: any) => {
            if (payload.new?.restaurante_id === restauranteSelecionado?.id || payload.old?.restaurante_id === restauranteSelecionado?.id) {
              fetchInitialData();
            }
          })

      } catch (error: any) {
        console.error("Erro na inicialização:", error);
        
        const isAuthError = 
          error.message?.toLowerCase().includes('refresh_token') || 
          error.message?.toLowerCase().includes('not found') ||
          error.message?.toLowerCase().includes('invalid');

        if (isAuthError) {
          await supabase.auth.signOut();
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-')) localStorage.removeItem(key);
          });
          setUser(null);
        } else {
          toast.error("Falha ao conectar com o servidor.");
        }
      } finally {
        setLoading(false);
      }
    };

    initializeApp();

    return () => {
      if (authSubscription) authSubscription.unsubscribe();
      if (configChannel) supabase.removeChannel(configChannel);
      if (dataChannel) supabase.removeChannel(dataChannel);
    };
  }, [selectedDate, restauranteSelecionado]);

  const handleRestauranteSelect = async (restaurante: Restaurante | null) => {
    if (!restaurante) {
      setRestauranteSelecionado(null);
      setShowRestauranteSelector(false);
      return;
    }

    if (!restaurante.ativo) {
      toast.error('Restaurante inativo. Escolha outro restaurante ou ative-o antes.');
      return;
    }

    setRestauranteSelecionado(restaurante);
    setShowRestauranteSelector(false);

    // Buscar dados do restaurante selecionado
    const ativo = await getSistemaAtivo(restaurante.id);
    setSistemaAtivo(ativo);
    await fetchInitialData(selectedDate, restaurante.id);
    toast.success(`Restaurante ${restaurante.nome} selecionado!`);
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
    toast.success('Sincronizado!');
  };

  const displayMesas = useMemo(() => {
    // Get local date properly (YYYY-MM-DD) avoiding UTC offset issues
    const localNow = new Date();
    const today = localNow.getFullYear() + '-' + String(localNow.getMonth() + 1).padStart(2, '0') + '-' + String(localNow.getDate()).padStart(2, '0');
    const isToday = selectedDate === today;

    return mesas.map(mesa => {
      // Find active reservation matching this explicitly selected date
      const reservaAtiva = [...reservas]
        .reverse()
        .find(r => r.mesa_id === mesa.id && r.status !== 'cancelada');
      
      // Calculate real status
      // A table is only 'ocupada' if it's actually occupied TODAY.
      const isOcupadaHoje = isToday && mesa.status === 'ocupada';
      
      let derivedStatus: TableStatus = 'livre';
      if (isOcupadaHoje) {
        derivedStatus = 'ocupada';
      } else if (reservaAtiva) {
        derivedStatus = 'reservada';
      }

      return {
        ...mesa,
        status: derivedStatus,
        cliente_nome: reservaAtiva ? reservaAtiva.nome_cliente : (isOcupadaHoje ? mesa.cliente_nome : undefined),
        num_pessoas: reservaAtiva ? reservaAtiva.num_pessoas : (isOcupadaHoje ? mesa.num_pessoas : undefined),
        hora_reserva: reservaAtiva ? reservaAtiva.hora_inicio : (isOcupadaHoje ? mesa.hora_reserva : undefined)
      } as Mesa;
    });
  }, [mesas, reservas, selectedDate]);

  const occupancyStats = useMemo(() => {
    const total = displayMesas.reduce((acc, mesa) => acc + mesa.capacidade, 0);
    const ocupados = displayMesas
      .filter(mesa => mesa.status !== 'livre')
      .reduce((acc, mesa) => acc + mesa.capacidade, 0);
    return { total, vagos: total - ocupados };
  }, [displayMesas]);

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    toast.success(`Bem-vindo, ${profile.full_name.split(' ')[0]}!`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleUpdateLounge = async (newMesas: Mesa[]) => {
    if (!restauranteSelecionado) return;

    // Adicionar restaurante_id às mesas
    const mesasComRestaurante = newMesas.map(mesa => ({
      ...mesa,
      restaurante_id: restauranteSelecionado.id
    }));

    await saveLoungeConfig(mesasComRestaurante);
    setMesas(mesasComRestaurante);
    toast.success('Layout do salão atualizado!');
  };

  const handleToggleSistema = async () => {
    if (togglingSistema || !restauranteSelecionado) return;
    
    setTogglingSistema(true);
    const novoValor = !sistemaAtivo;
    try {
      await updateSistemaAtivo(restauranteSelecionado.id, novoValor);
      setSistemaAtivo(novoValor);
      toast.success(`Sistema ${novoValor ? 'Ativado' : 'Desativado'}!`);
    } catch (e: any) {
      console.error("Erro ao alternar sistema:", e);
      toast.error(`Erro: ${e.message || "Falha na comunicação"}`);
    } finally {
      setTogglingSistema(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-950 text-amber-500">
      <RefreshCw className="animate-spin w-12 h-12" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <AuthForm onLogin={handleLogin} />
    </div>
  );

  // Seletor de restaurante para usuários que precisam escolher
  if (showRestauranteSelector) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl p-8">
          <div className="text-center mb-8">
            <Building2 size={48} className="text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white uppercase italic mb-2">Selecionar Restaurante</h2>
            <p className="text-slate-400">Escolha o restaurante que deseja gerenciar</p>
          </div>

          <div className="space-y-3">
            {restaurantes.map((restaurante) => (
              <button
                key={restaurante.id}
                onClick={() => handleRestauranteSelect(restaurante)}
                className="w-full p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-left transition-all"
              >
                <h3 className="font-bold text-white">{restaurante.nome}</h3>
                {restaurante.endereco && (
                  <p className="text-sm text-slate-400 mt-1">{restaurante.endereco}</p>
                )}
              </button>
            ))}

            {user.role === 'super_admin' && (
              <>
                <div className="border-t border-slate-700 my-4"></div>
                <button
                  onClick={() => { setActiveTab('restaurantes'); setShowRestauranteSelector(false); }}
                  className="w-full p-4 bg-amber-500/10 hover:bg-amber-500/20 rounded-2xl text-amber-500 font-bold transition-all"
                >
                  <Building2 size={20} className="inline mr-2" />
                  Gerenciar Restaurantes
                </button>
              </>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full mt-6 p-3 text-rose-500 hover:bg-rose-500/10 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      <Toaster position="top-right" />
      
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-8 border-b border-slate-800 flex flex-col items-center gap-2">
          <div className="p-3 bg-amber-500/10 rounded-2xl shadow-lg shadow-amber-500/5">
            <Crown className="text-amber-500 w-10 h-10" />
          </div>
          <div className="text-center">
            <h1 className="font-black text-lg tracking-tighter text-white uppercase italic">Rainha das</h1>
            <p className="font-bold text-amber-500 text-xs tracking-[0.3em] uppercase">Pizzas</p>
            {restauranteSelecionado && (
              <p className="text-slate-400 text-xs mt-1 font-medium">{restauranteSelecionado.nome}</p>
            )}
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-amber-500/10 text-amber-500' : 'text-slate-500 hover:text-slate-100'}`}>
            <LayoutDashboard size={20} /> Mapa de Mesas
          </button>
          <button onClick={() => setActiveTab('config')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'config' ? 'bg-amber-500/10 text-amber-500' : 'text-slate-500 hover:text-slate-100'}`}>
            <SlidersHorizontal size={20} /> Configurar Salão
          </button>
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'profile' ? 'bg-amber-500/10 text-amber-500' : 'text-slate-500 hover:text-slate-100'}`}>
            <UserCircle size={20} /> Meu Perfil
          </button>
          
          {user.role === 'super_admin' && (
            <button onClick={() => setActiveTab('restaurantes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'restaurantes' ? 'bg-amber-500/10 text-amber-500' : 'text-slate-500 hover:text-slate-100'}`}>
              <Building2 size={20} /> Restaurantes
            </button>
          )}
          
          {user.role === 'super_admin' && (
            <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-amber-500/10 text-amber-500' : 'text-slate-500 hover:text-slate-100'}`}>
              <Users size={20} /> Usuários
            </button>
          )}
          
          <div className="pt-4 space-y-3">
            {user.role === 'super_admin' && (
              <button 
                onClick={() => setShowRestauranteSelector(true)}
                className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl font-black uppercase tracking-widest transition-all border-2 border-slate-600 text-slate-400 hover:bg-slate-600/10 shadow-lg"
              >
                <Building2 size={18} />
                Trocar Restaurante
              </button>
            )}

            <a 
              href="https://n8nanderson.up.railway.app/webhook/qrcode-rainha" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl font-black uppercase tracking-widest transition-all border-2 border-sky-500 text-sky-400 hover:bg-sky-500/10 shadow-lg shadow-sky-500/10"
            >
              <MessageCircle size={18} />
              Whatsapp
            </a>

            <button 
              onClick={handleToggleSistema}
              disabled={togglingSistema}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-xl font-black uppercase tracking-widest transition-all border-2 ${sistemaAtivo ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5 shadow-lg shadow-emerald-500/10' : 'border-slate-700 text-slate-500 hover:border-slate-600'} ${togglingSistema ? 'opacity-50 cursor-wait' : ''}`}
            >
              <div className="flex items-center gap-3">
                {togglingSistema ? <RefreshCw size={18} className="animate-spin" /> : <Power size={18} />}
                <span className="text-[11px]">{sistemaAtivo ? 'Sistema Ativo' : 'Sistema Inativo'}</span>
              </div>
              <div className={`w-8 h-4 rounded-full relative transition-all ${sistemaAtivo ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${sistemaAtivo ? 'right-0.5' : 'left-0.5'}`}></div>
              </div>
            </button>

            <a 
              href="https://docs.google.com/document/d/1-A0kGsHXRGBmMKPZynBnUXGIOmWIOu-1vfkr6hjolio/edit?tab=t.0" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl font-black uppercase tracking-widest transition-all border-2 border-amber-500 text-amber-500 hover:bg-amber-500/10 shadow-lg shadow-amber-500/10"
            >
              <Ticket size={18} />
              Promoções
            </a>
          </div>
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-950/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center font-bold text-white uppercase shrink-0 shadow-lg shadow-amber-900/40">
              {user.full_name.substring(0, 2)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-slate-100 leading-tight">{user.full_name}</p>
              <p className="text-[10px] text-slate-500 truncate font-medium">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-rose-500 hover:bg-rose-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
            <LogOut size={14} /> Encerrar
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6 md:p-10">
        {activeTab === 'dashboard' ? (
          <>
            <header className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Mapa de Mesas</h2>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl focus-within:border-amber-500/50 transition-all">
                    <Calendar size={18} className="text-amber-500" />
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-none outline-none text-slate-200 font-black text-sm [color-scheme:dark]" />
                  </div>
                  <button onClick={handleManualRefresh} disabled={refreshing} className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl hover:bg-slate-800 text-slate-300 transition-all active:scale-95">
                    <RefreshCw size={18} className={`text-amber-500 ${refreshing ? 'animate-spin' : ''}`} />
                    <span className="text-xs font-black uppercase tracking-widest">Sincronizar</span>
                  </button>
                  <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-5 py-2 rounded-2xl shadow-xl">
                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><Users size={18} /></div>
                    <div>
                      <p className="text-[9px] uppercase font-black text-slate-500 leading-tight tracking-widest">LUGARES LIVRES</p>
                      <p className="text-lg font-black leading-tight"><span className="text-emerald-500">{occupancyStats.vagos}</span><span className="text-slate-800 mx-1">/</span><span className="text-slate-400">{occupancyStats.total}</span></p>
                    </div>
                  </div>
                  
                  {user.role === 'super_admin' && (
                    <button 
                      onClick={() => setActiveTab('users')}
                      className="flex items-center gap-2 bg-amber-500 text-slate-950 px-4 py-2 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-400 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
                    >
                      <Users size={18} />
                      Gerenciar Usuários
                    </button>
                  )}
                </div>
              </div>
            </header>
            <TableMap mesas={displayMesas} isSystemOpen={sistemaAtivo} userRole={user.role} selectedDate={selectedDate} restauranteId={restauranteSelecionado?.id || ''} />
          </>
        ) : activeTab === 'config' ? (
          <LoungeConfig mesas={mesas} onUpdate={handleUpdateLounge} />
        ) : activeTab === 'users' ? (
          <UserManagement />
        ) : activeTab === 'restaurantes' ? (
          <RestauranteManagement restaurantes={restaurantes} onRestaurantesUpdate={setRestaurantes} userRole={user?.role} />
        ) : (
          <ProfileSettings user={user} onProfileUpdate={setUser} />
        )}
      </main>
    </div>
  );
};

export default App;
