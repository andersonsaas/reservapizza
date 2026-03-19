
import React from 'react';
import { Mesa } from '../types';
import { Users } from 'lucide-react';

interface TableCardProps {
  mesa: Mesa;
  onClick: () => void;
}

const TableCard: React.FC<TableCardProps> = ({ mesa, onClick }) => {
  const getStatusStyles = () => {
    switch (mesa.status) {
      case 'ocupada':
        return 'bg-rose-600 border-rose-500 text-white shadow-rose-900/40';
      case 'reservada':
        return 'bg-amber-500 border-amber-400 text-slate-950 shadow-amber-900/30';
      default:
        return 'bg-slate-900 border-slate-800 text-slate-400 hover:border-amber-500/50 hover:bg-slate-800/80';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        aspect-square rounded-[2.5rem] border-2 p-5 flex flex-col items-center justify-between
        transition-all duration-300 transform active:scale-95 shadow-xl animate-fade-in
        ${getStatusStyles()}
      `}
    >
      {/* Número da Mesa */}
      <div className="text-5xl font-black italic tracking-tighter leading-none">
        {mesa.numero}
      </div>
      
      {/* Informações do Cliente */}
      <div className="flex flex-col items-center w-full">
        {mesa.status !== 'livre' ? (
          <div className="flex flex-col items-center w-full animate-fade-in">
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${mesa.status === 'reservada' ? 'text-slate-900/40' : 'text-white/40'}`}>
              Cliente
            </span>
            <div className={`
              w-full py-2 px-3 rounded-2xl text-[11px] font-black truncate text-center uppercase tracking-tighter flex flex-col items-center
              ${mesa.status === 'reservada' ? 'bg-black/10 text-slate-950' : 'bg-white/20 text-white'}
            `}>
              <span className="truncate w-full">{mesa.cliente_nome || "NOME N/A"}</span>
              {mesa.num_pessoas && (
                <span className={`text-[8px] opacity-70 mt-0.5 font-bold ${mesa.status === 'reservada' ? 'text-slate-950/60' : 'text-white/60'}`}>
                  • {mesa.num_pessoas} PES •
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 opacity-40">
            <Users size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">{mesa.capacidade} Lugares</span>
          </div>
        )}
      </div>

      {/* Status Pill */}
      <div className={`
        px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em]
        ${mesa.status === 'livre' ? 'bg-slate-950/50 text-slate-500' : 'bg-black/20 shadow-inner'}
      `}>
        {mesa.status}
      </div>
    </button>
  );
};

export default TableCard;
