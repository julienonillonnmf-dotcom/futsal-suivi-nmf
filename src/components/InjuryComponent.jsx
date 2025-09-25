// components/InjuryComponent.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

const InjuryComponent = ({ injuries, onChange, showNewInjury = false }) => {
  const bodyParts = [
    'Cheville gauche', 'Cheville droite', 'Genou gauche', 'Genou droit',
    'Cuisse gauche', 'Cuisse droite', 'Mollet gauche', 'Mollet droit',
    'Dos', 'Épaule gauche', 'Épaule droite', 'Poignet gauche', 'Poignet droit',
    'Tête', 'Autre'
  ];

  const handleInjuryChange = (index, field, value) => {
    const newInjuries = [...injuries];
    newInjuries[index] = { ...newInjuries[index], [field]: value };
    onChange(newInjuries);
  };

  const removeInjury = (index) => {
    const newInjuries = injuries.filter((_, i) => i !== index);
    onChange(newInjuries);
  };

  const addInjury = () => {
    onChange([...injuries, { location: '', intensity: 5 }]);
  };

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center">
        <AlertTriangle size={16} className="mr-2" />
        Suivi des blessures
      </h3>
      
      {injuries.map((injury, index) => (
        <div key={index} className="mb-4 p-3 bg-white rounded border">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Localisation
              </label>
              <select
                value={injury.location || ''}
                onChange={(e) => handleInjuryChange(index, 'location', e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:border-red-500"
              >
                <option value="">Sélectionner</option>
                {bodyParts.map(part => (
                  <option key={part} value={part}>{part}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Intensité douleur (1-10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={injury.intensity || 5}
                onChange={(e) => handleInjuryChange(index, 'intensity', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-center text-gray-600">{injury.intensity || 5}/10</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => removeInjury(index)}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Supprimer cette blessure
          </button>
        </div>
      ))}
      
      <button
        type="button"
        onClick={addInjury}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        + Ajouter une blessure
      </button>
      
      {injuries.length === 0 && (
        <p className="text-sm text-gray-600 italic">
          Aucune blessure à signaler ? Cliquez sur "Ajouter une blessure" si nécessaire.
        </p>
      )}
    </div>
  );
};

export default InjuryComponent;
