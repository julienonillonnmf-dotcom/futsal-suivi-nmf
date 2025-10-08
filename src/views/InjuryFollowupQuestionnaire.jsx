// src/views/InjuryFollowupQuestionnaire.jsx

import React, { useState } from 'react';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import InjuryComponent from '../components/InjuryComponent';

const InjuryFollowupQuestionnaire = ({ 
  selectedPlayer,
  setCurrentView,
  loading,
  setLoading,
  supabase,
  loadPlayers
}) => {
  
  const [injuryFollowUpForm, setInjuryFollowUpForm] = useState({
    activite: 'futsal', // NOUVEAU CHAMP
    injuries: [],
    commentaires_libres: ''
  });

  const saveQuestionnaire = async () => {
    if (!selectedPlayer) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('responses')
        .insert({
          player_id: selectedPlayer.id,
          type: 'injury',
          data: injuryFollowUpForm
        });
      
      if (error) throw error;
      
      alert('Suivi blessure sauvegardé !');
      
      // Réinitialiser le formulaire
      setInjuryFollowUpForm({
        activite: 'futsal', // NOUVEAU
        injuries: [],
        commentaires_libres: ''
      });
      
      // Recharger les données
      await loadPlayers();
      setCurrentView('player-detail');
      
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
    setLoading(false);
  };

  if (!selectedPlayer) return null;

  return (
    <div className="min-h-screen p-4" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold" style={{color: '#1D2945'}}>
                🏥 Suivi Blessure
              </h1>
              <p className="text-gray-600">{selectedPlayer.name}</p>
            </div>
            <button
              onClick={() => setCurrentView('player-detail')}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              <ChevronLeft size={16} />
              <span>Retour</span>
            </button>
          </div>

          <div className="space-y-6">
            {/* NOUVEAU : Sélecteur d'activité */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6 border-2 border-purple-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                🏃 Type d'activité concernée
              </label>
              <select
                value={injuryFollowUpForm.activite}
                onChange={(e) => setInjuryFollowUpForm({...injuryFollowUpForm, activite: e.target.value})}
                className="w-full p-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-base font-medium"
              >
                <option value="futsal">⚽ Futsal</option>
                <option value="foot">⚽ Football</option>
                <option value="autre">🏃 Autre</option>
              </select>
            </div>

            {/* AMÉLIORATION: Information explicative pour le suivi médical */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3 text-red-800 flex items-center">
                <AlertTriangle size={20} className="mr-2" />
                État de vos blessures actuelles
              </h3>
              <div className="text-sm text-red-700 space-y-2">
                <p>
                  <strong>Objectif :</strong> Suivre l'évolution de vos blessures existantes pour adapter l'entraînement.
                </p>
                <p>
                  <strong>Instructions :</strong> Indiquez l'état actuel de toutes vos blessures, même celles en cours de guérison.
                </p>
                <p>
                  <strong>Fréquence :</strong> À remplir selon les instructions de votre entraîneur ou staff médical.
                </p>
              </div>
            </div>

            {/* AMÉLIORATION: Composant blessures optimisé pour le suivi médical */}
            <InjuryComponent
              injuries={injuryFollowUpForm.injuries}
              onChange={(injuries) => setInjuryFollowUpForm({...injuryFollowUpForm, injuries})}
            />

            {/* Zone de commentaires spécialisée pour l'évolution médicale */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Évolution et commentaires médicaux (optionnel)
              </label>
              <textarea
                value={injuryFollowUpForm.commentaires_libres}
                onChange={(e) => setInjuryFollowUpForm({...injuryFollowUpForm, commentaires_libres: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-red-500"
                rows="4"
                placeholder="Décrivez l'évolution de vos blessures depuis le dernier suivi :&#10;- Amélioration ou aggravation ?&#10;- Traitements suivis (kiné, repos, médicaments...)&#10;- Douleurs particulières ou limitations&#10;- Questions pour l'entraîneur ou le staff médical"
              />
            </div>

            {/* Informations additionnelles sur la confidentialité */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600">
                <strong>Confidentialité :</strong> Ces informations sont partagées uniquement avec l'entraîneur et le staff médical pour assurer votre sécurité et adapter votre programme d'entraînement.
              </p>
            </div>
          </div>

          <button
            onClick={saveQuestionnaire}
            disabled={loading}
            className="w-full mt-8 py-4 text-white rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50"
            style={{background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'}}
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder Suivi Médical'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InjuryFollowupQuestionnaire;
