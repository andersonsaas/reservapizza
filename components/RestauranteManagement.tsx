import React, { useState } from 'react';
import { Building2, Plus, Edit, Trash2, MapPin, Phone, Mail } from 'lucide-react';
import { Restaurante } from '../types';
import { createRestaurante, updateRestaurante, deleteRestaurante, getRestaurantes, setRestauranteAtivo } from '../services/supabaseService';
import { toast } from 'react-hot-toast';

interface RestauranteManagementProps {
  restaurantes: Restaurante[];
  onRestaurantesUpdate: (restaurantes: Restaurante[]) => void;
}

const RestauranteManagement: React.FC<RestauranteManagementProps> = ({
  restaurantes,
  onRestaurantesUpdate
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingRestaurante, setEditingRestaurante] = useState<Restaurante | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    endereco: '',
    telefone: '',
    email: '',
    ativo: true,
    cor_primaria: '#f59e0b',
    cor_secundaria: '#374151'
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      nome: '',
      slug: '',
      endereco: '',
      telefone: '',
      email: '',
      ativo: true,
      cor_primaria: '#f59e0b',
      cor_secundaria: '#374151'
    });
    setEditingRestaurante(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.slug.trim()) return;

    setLoading(true);
    try {
      if (editingRestaurante) {
        await updateRestaurante(editingRestaurante.id, formData);
        toast.success('Restaurante atualizado!');
      } else {
        await createRestaurante(formData);
        toast.success('Restaurante criado!');
      }

      // Recarregar lista
      const updatedRestaurantes = await getRestaurantes();
      onRestaurantesUpdate(updatedRestaurantes);
      resetForm();
    } catch (error: any) {
      const message =
        (typeof error === 'string' && error) ||
        error?.message ||
        error?.details ||
        (error?.error_description ? `${error.error_description}` : null) ||
        'Erro ao salvar restaurante (verifique logs).';
      toast.error(message);
      console.error('Erro criando restaurante:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (restaurante: Restaurante) => {
    setEditingRestaurante(restaurante);
    setFormData({
      nome: restaurante.nome,
      slug: restaurante.slug,
      endereco: restaurante.endereco || '',
      telefone: restaurante.telefone || '',
      email: restaurante.email || '',
      ativo: restaurante.ativo ?? true,
      cor_primaria: restaurante.cor_primaria,
      cor_secundaria: restaurante.cor_secundaria
    });
    setShowForm(true);
  };

  const handleDelete = async (restaurante: Restaurante) => {
    if (!confirm(`Tem certeza que deseja excluir o restaurante "${restaurante.nome}"?`)) return;

    try {
      await deleteRestaurante(restaurante.id);
      const updatedRestaurantes = await getRestaurantes();
      onRestaurantesUpdate(updatedRestaurantes);
      toast.success('Restaurante excluído!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir restaurante');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Gerenciar Restaurantes</h2>
          <p className="text-slate-400 mt-2">Crie e gerencie restaurantes na plataforma</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-amber-500 text-slate-950 px-6 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-amber-400 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
        >
          <Plus size={20} />
          Novo Restaurante
        </button>
      </header>

      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <h3 className="text-xl font-black text-white uppercase italic mb-6">
            {editingRestaurante ? 'Editar Restaurante' : 'Novo Restaurante'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-slate-400 font-bold text-sm">Nome do Restaurante *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-white focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                  placeholder="Ex: Pizzaria do João"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 font-bold text-sm">Slug (URL) *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-white focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                  placeholder="pizzaria-do-joao"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 font-bold text-sm">Endereço</label>
              <input
                type="text"
                value={formData.endereco}
                onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-white focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                placeholder="Rua das Pizzas, 123 - Centro"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-slate-400 font-bold text-sm">Telefone</label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-white focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 font-bold text-sm">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-white focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                  placeholder="contato@pizzaria.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-slate-400 font-bold text-sm">Cor Primária</label>
                <input
                  type="color"
                  value={formData.cor_primaria}
                  onChange={(e) => setFormData({...formData, cor_primaria: e.target.value})}
                  className="w-full h-12 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 font-bold text-sm">Cor Secundária</label>
                <input
                  type="color"
                  value={formData.cor_secundaria}
                  onChange={(e) => setFormData({...formData, cor_secundaria: e.target.value})}
                  className="w-full h-12 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-slate-400 font-bold text-sm">Status do Restaurante</label>
                <select
                  value={formData.ativo ? 'ativo' : 'inativo'}
                  onChange={(e) => setFormData({...formData, ativo: e.target.value === 'ativo'})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-white focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-slate-800 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-amber-500 text-slate-950 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl"
              >
                {loading ? 'Salvando...' : (editingRestaurante ? 'Atualizar' : 'Criar')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurantes.map((restaurante) => (
          <div key={restaurante.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: restaurante.cor_primaria + '20', boxShadow: `0 0 20px ${restaurante.cor_primaria}20` }}
                >
                  <Building2 size={24} style={{ color: restaurante.cor_primaria }} />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg">{restaurante.nome}</h3>
                  <p className="text-slate-400 text-sm">/{restaurante.slug}</p>
                  <span className={`inline-flex items-center px-2 py-1 mt-1 text-xs font-black rounded-full ${restaurante.ativo ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                    {restaurante.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(restaurante)}
                  className="p-2 text-slate-400 hover:text-amber-500 transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(restaurante)}
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={async () => {
                    try {
                      await setRestauranteAtivo(restaurante.id, !restaurante.ativo);
                      onRestaurantesUpdate(restaurantes.map(r => r.id === restaurante.id ? {...r, ativo: !r.ativo} : r));
                      toast.success(`Restaurante ${restaurante.ativo ? 'desativado' : 'ativado'} com sucesso!`);
                    } catch (error: any) {
                      toast.error('Erro ao alterar status do restaurante.');
                    }
                  }}
                  className={`p-2 rounded-lg text-xs font-black ${restaurante.ativo ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white'}`}
                >
                  {restaurante.ativo ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {restaurante.endereco && (
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin size={14} />
                  <span>{restaurante.endereco}</span>
                </div>
              )}
              {restaurante.telefone && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Phone size={14} />
                  <span>{restaurante.telefone}</span>
                </div>
              )}
              {restaurante.email && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail size={14} />
                  <span>{restaurante.email}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <div
                className="flex-1 h-3 rounded-full"
                style={{ backgroundColor: restaurante.cor_primaria + '40' }}
              ></div>
              <div
                className="flex-1 h-3 rounded-full"
                style={{ backgroundColor: restaurante.cor_secundaria + '40' }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {restaurantes.length === 0 && (
        <div className="text-center py-20 bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl">
          <Building2 size={48} className="text-slate-500 mx-auto mb-4" />
          <p className="text-slate-500">Nenhum restaurante cadastrado ainda.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-amber-500 hover:text-amber-400 font-bold"
          >
            Criar primeiro restaurante
          </button>
        </div>
      )}
    </div>
  );
};

export default RestauranteManagement;