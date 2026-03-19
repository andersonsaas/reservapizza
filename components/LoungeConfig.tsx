
import React, { useState } from 'react';
import { Mesa } from '../types';
import { Plus, Minus, Save, Trash2, Users, AlertCircle, Loader2 } from 'lucide-react';

interface LoungeConfigProps {
  mesas: Mesa[];
  onUpdate: (mesas: Mesa[]) => Promise<void>;
}

const LoungeConfig: React.FC<LoungeConfigProps> = ({ mesas, onUpdate }) => {
  const [localMesas, setLocalMesas] = useState<Mesa[]>([...mesas]);
  const [isSaving, setIsSaving] = useState(false);

  const generateId = () => {
    try {
      return crypto.randomUUID();
    } catch (e) {
      return Math.random().toString(36).substring(2, 15);
    }
  };

  const handleAddTable = () => {
    const nextNumber = localMesas.length > 0 ? Math.max(...localMesas.map(m => m.numero)) + 1 : 1;
    const newMesa: Mesa = {
      id: generateId(),
      numero: nextNumber,
      capacidade: 4,
      status: 'livre'
    };
    setLocalMesas([...localMesas, newMesa]);
  };

  const handleRemoveTable = (id: string) => {
    setLocalMesas(localMesas.filter(m => m.id !== id));
  };

  const updateCapacity = (id: string, capacity: number) => {
    if (capacity < 1) return;
    setLocalMesas(localMesas.map(m => m.id === id ? { ...m, capacidade: capacity } : m));
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onUpdate(localMesas);
    } catch (error) {
      // Erro já tratado no App.tsx
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl animate-fade-in">
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Configuração de Salão</h2>
          <p className="text-slate-400 mt-1">Defina a quantidade de mesas e lugares.</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={handleAddTable}
            disabled={isSaving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl transition-all font-bold"
          >
            <Plus size={20} />
            Mesa
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white px-6 py-3 rounded-xl transition-all font-bold shadow-lg shadow-rose-900/20"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Mesa</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Capacidade</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {localMesas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                    Nenhuma mesa adicionada. Clique em "Adicionar Mesa".
                  </td>
                </tr>
              ) : (
                localMesas.sort((a, b) => a.numero - b.numero).map((mesa) => (
                  <tr key={mesa.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-black text-xl text-rose-500">
                      #{mesa.numero}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateCapacity(mesa.id, mesa.capacidade - 1)}
                          disabled={isSaving}
                          className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 text-slate-400 transition-colors disabled:opacity-30"
                        >
                          <Minus size={14} />
                        </button>
                        <div className="flex items-center gap-2 min-w-[2.5rem] justify-center">
                          <Users size={14} className="text-slate-500" />
                          <span className="font-bold text-lg">{mesa.capacidade}</span>
                        </div>
                        <button 
                          onClick={() => updateCapacity(mesa.id, mesa.capacidade + 1)}
                          disabled={isSaving}
                          className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 text-slate-400 transition-colors disabled:opacity-30"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        mesa.status === 'livre' ? 'bg-emerald-500/10 text-emerald-500' :
                        mesa.status === 'ocupada' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {mesa.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleRemoveTable(mesa.id)}
                        disabled={isSaving}
                        className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-30"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-sm text-slate-500">
        <AlertCircle size={18} className="shrink-0" />
        <p>A numeração das mesas é gerada automaticamente. Lembre-se de salvar após as alterações.</p>
      </div>
    </div>
  );
};

export default LoungeConfig;
