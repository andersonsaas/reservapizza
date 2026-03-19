
import React, { useState, useEffect } from 'react';
import { Mesa, TableStatus } from '../types';
import { X, User, Clock, Check, CalendarDays, AlertTriangle, Users } from 'lucide-react';
import { updateMesaStatus, createReserva } from '../services/supabaseService';
import { toast } from 'react-hot-toast';

interface ReservationModalProps {
  mesa: Mesa;
  onClose: () => void;
  isSystemOpen: boolean;
  initialDate: string;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ mesa, onClose, isSystemOpen, initialDate }) => {
  const [view, setView] = useState<'options' | 'booking' | 'quick-occupy'>('options');
  const [showConfirmRelease, setShowConfirmRelease] = useState(false);
  const [clientName, setClientName] = useState('');
  const [numPessoas, setNumPessoas] = useState<string>(mesa.capacidade.toString());
  const [time, setTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(initialDate);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mesa.status === 'reservada' || mesa.status === 'ocupada') {
      setView('options');
    }
  }, [mesa.status]);

  const handleStatusChange = async (status: TableStatus) => {
    setLoading(true);
    try {
      await updateMesaStatus(mesa.id, status);
      toast.success(status === 'livre' ? 'Mesa liberada!' : 'Mesa ocupada!');
      onClose();
    } catch (e) {
      toast.error("Erro ao atualizar mesa.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickOccupy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    setLoading(true);
    try {
      await createReserva({
        mesa_id: mesa.id,
        nome_cliente: clientName.trim(),
        num_pessoas: parseInt(numPessoas) || 1,
        data_reserva: today,
        hora_inicio: time
      });
      await updateMesaStatus(mesa.id, 'ocupada');
      toast.success('Mesa ocupada!');
      onClose();
    } catch (e) {
      toast.error("Erro ao ocupar mesa.");
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !date || !time) return;
    
    setLoading(true);
    try {
      await createReserva({
        mesa_id: mesa.id,
        nome_cliente: clientName.trim(),
        num_pessoas: parseInt(numPessoas) || 1,
        data_reserva: date,
        hora_inicio: time
      });
      toast.success('Reserva confirmada!');
      onClose();
    } catch (e) {
      toast.error("Erro ao realizar reserva.");
    } finally {
      setLoading(false);
    }
  };

  const isToday = initialDate === today;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex flex-col">
            <h3 className="text-xl font-black text-white uppercase italic">Mesa {mesa.numero}</h3>
            <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Capacidade: {mesa.capacidade} Pessoas</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {mesa.status === 'ocupada' ? (
            <div className="text-center space-y-6">
              {!showConfirmRelease ? (
                <>
                  <div className="w-20 h-20 bg-rose-600/20 text-rose-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Clock size={40} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-lg text-white uppercase italic">Ocupada</h4>
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-amber-500 font-bold uppercase text-[11px] tracking-widest">
                        Cliente: {mesa.cliente_nome || 'Check-in Direto'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {mesa.hora_reserva && (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 rounded-full text-[10px] font-black text-rose-500/70 border border-rose-500/20">
                            <Clock size={12} /> {mesa.hora_reserva}
                          </span>
                        )}
                        {mesa.num_pessoas && (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-full text-[10px] font-black text-amber-500/70 border border-amber-500/20">
                            <Users size={12} /> {mesa.num_pessoas} PESSOAS
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    disabled={loading}
                    onClick={() => setShowConfirmRelease(true)}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
                  >
                    Encerrar Atendimento
                  </button>
                </>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <div className="w-20 h-20 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle size={40} />
                  </div>
                  <h4 className="font-black text-lg text-white uppercase italic">Confirmar Saída?</h4>
                  <div className="flex flex-col gap-3">
                    <button 
                      disabled={loading}
                      onClick={() => handleStatusChange('livre')}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all"
                    >
                      Sim, Liberar Mesa
                    </button>
                    <button 
                      onClick={() => setShowConfirmRelease(false)}
                      className="w-full bg-slate-800 text-slate-400 py-3 rounded-2xl font-bold uppercase text-xs transition-all"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : mesa.status === 'reservada' ? (
            <div className="text-center space-y-8">
              <div className="w-20 h-20 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                <CalendarDays size={40} />
              </div>
              <div className="space-y-2">
                <h4 className="font-black text-2xl text-white uppercase italic tracking-tighter">RESERVADA</h4>
                <div className="flex flex-col items-center justify-center gap-2">
                  <span className="text-amber-500 font-bold uppercase text-xs tracking-[0.2em] opacity-60">Cliente</span>
                  <div className="flex items-center gap-2 bg-amber-500/10 px-4 py-2 rounded-2xl border border-amber-500/20">
                    <span className="text-amber-500 font-black uppercase text-sm">{mesa.cliente_nome || "Nome não informado"}</span>
                    {mesa.hora_reserva && (
                      <>
                        <div className="w-1 h-1 bg-amber-500/30 rounded-full mx-1"></div>
                        <span className="text-amber-500 font-black text-sm flex items-center gap-1">
                          <Clock size={14} /> {mesa.hora_reserva}
                        </span>
                      </>
                    )}
                    {mesa.num_pessoas && (
                      <>
                        <div className="w-1 h-1 bg-amber-500/30 rounded-full mx-1"></div>
                        <span className="text-amber-500/60 font-black text-[10px] whitespace-nowrap">{mesa.num_pessoas} PESSOAS</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  disabled={loading}
                  onClick={() => handleStatusChange('ocupada')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Confirmar Chegada
                </button>
                <button 
                  disabled={loading}
                  onClick={() => handleStatusChange('livre')}
                  className="bg-slate-800 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : view === 'options' ? (
            <div className="space-y-4">
              {isToday && (
                <button 
                  onClick={() => setView('quick-occupy')}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white py-6 rounded-2xl font-black text-xl flex flex-col items-center justify-center shadow-xl border-b-4 border-rose-800 transition-all active:translate-y-1 active:border-b-0"
                >
                  <span className="uppercase italic">OCUPAR AGORA</span>
                  <span className="text-[10px] opacity-70 font-black uppercase tracking-widest mt-1">Sente o Cliente</span>
                </button>
              )}
              <button 
                onClick={() => setView('booking')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-5 rounded-2xl font-black flex flex-col items-center justify-center border border-slate-700 transition-all active:scale-95"
              >
                <span className="text-lg uppercase italic tracking-tighter">AGENDAR RESERVA</span>
                <span className="text-[10px] opacity-50 font-black uppercase tracking-widest">{isToday ? 'Data Futura' : `Para ${initialDate}`}</span>
              </button>
            </div>
          ) : view === 'quick-occupy' ? (
            <form onSubmit={handleQuickOccupy} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Nome do Cliente</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                    <input 
                      type="text" 
                      autoFocus
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-rose-500 outline-none font-bold"
                      placeholder="Nome do cliente"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Pessoas</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" size={16} />
                    <input 
                      type="number" 
                      min="1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-10 pr-2 text-white focus:ring-2 focus:ring-rose-500 outline-none font-bold text-center"
                      value={numPessoas}
                      onChange={(e) => setNumPessoas(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setView('options')} className="flex-1 bg-slate-800 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all">Voltar</button>
                <button type="submit" disabled={loading} className="flex-[2] bg-rose-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all">
                  {loading ? 'Processando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleBooking} className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Nome do Cliente</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                    <input 
                      type="text" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                      placeholder="Nome para a reserva"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Pessoas</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" size={16} />
                    <input 
                      type="number" 
                      min="1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-10 pr-2 text-white focus:ring-2 focus:ring-amber-500 outline-none font-bold text-center"
                      value={numPessoas}
                      onChange={(e) => setNumPessoas(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Data</label>
                  <input 
                    type="date" 
                    min={today}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-white font-bold [color-scheme:dark]"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Horário</label>
                  <input 
                    type="time" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-white font-bold [color-scheme:dark]"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setView('options')} className="flex-1 bg-slate-800 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Voltar</button>
                <button type="submit" disabled={loading} className="flex-[2] bg-amber-500 text-slate-950 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-xl transition-all">
                  {loading ? 'Salvando...' : 'Confirmar Reserva'}
                  {!loading && <Check size={20} />}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationModal;
