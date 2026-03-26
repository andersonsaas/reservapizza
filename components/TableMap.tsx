
import React, { useState } from 'react';
import { Mesa } from '../types';
import TableCard from './TableCard';
import ReservationModal from './ReservationModal';
import { toast } from 'react-hot-toast';

interface TableMapProps {
  mesas: Mesa[];
  isSystemOpen: boolean;
  userRole: string;
  selectedDate: string;
  restauranteId: string;
}

const TableMap: React.FC<TableMapProps> = ({ mesas, isSystemOpen, userRole, selectedDate, restauranteId }) => {
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);

  const handleTableAction = (mesa: Mesa) => {
    setSelectedMesa(mesa);
  };

  return (
    <div className="relative">
      {mesas.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl">
          <p className="text-slate-500">Nenhuma mesa configurada para este salão.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-fade-in" key={selectedDate}>
          {mesas.map((mesa) => (
            <TableCard 
              key={`${mesa.id}-${selectedDate}`} 
              mesa={mesa} 
              onClick={() => handleTableAction(mesa)} 
            />
          ))}
        </div>
      )}

      {selectedMesa && (
        <ReservationModal 
          mesa={selectedMesa} 
          onClose={() => setSelectedMesa(null)}
          isSystemOpen={isSystemOpen}
          initialDate={selectedDate}
          restauranteId={restauranteId}
        />
      )}
    </div>
  );
};

export default TableMap;
