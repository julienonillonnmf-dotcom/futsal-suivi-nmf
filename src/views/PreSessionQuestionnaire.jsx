// src/views/PreSessionQuestionnaire.jsx

import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import ScaleQuestion from '../components/ScaleQuestion';
import InjuryComponent from '../components/InjuryComponent';

const PreSessionQuestionnaire = ({ 
  selectedPlayer,
  setCurrentView,
  objectifsCollectifs,
  objectifsIndividuels,
  objectifsMentaux,  // AMÉLIORATION: Objectifs mentaux ajoutés
  loading,
  setLoading,
  supabase,
  loadPlayers
}) => {
  
  const [preSessionForm, setPreSessionForm] = useState({
    motivation: 10,
    fatigue: 10,
    plaisir: 10,
    objectif_difficulte: 10,
    injuries: []  // AMÉLIORATION: Suivi des blessures intégré
  });

  const saveQuestionnaire = async () => {
    if (!selectedPlayer) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('responses')
        .insert({
          player_id: selectedPlayer.id,
          type: 'pre',
          data: preSessionForm
        });
      
      if (error) throw error;
      
      alert('Questionnaire sauvegardé !');
      
      // Réinitialiser le formulaire
      setPreSessionForm({
        motivation: 10,
        fatigue: 10,
        plaisir: 10,
        objectif_difficulte: 10,
        injuries: []
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
              <h1 className="text-2xl font-bold" style={{color: '#1D2945'}}>Questionnaire Pré-Séance</h1>
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
            {/* AMÉLIORATION: Affichage des 3 types d'objectifs */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3" style={{color: '#1D2945'}}>
                🎯 Objectifs pour cette séance
              </h3>
              
              {/* Objectifs Collectifs */}
              {objectifsCollectifs && (
                <div className="mb-4">
                  <h4 className="font-medium text-blue-800 mb-2">Objectifs de l'équipe :</h4>
                  <div className="bg-white p-3 rounded border-l-4 border-blue-400">
                    <p className="text-gray-700 whitespace-pre-wrap">{objectifsCollectifs}</p>
                  </div>
                </div>
              )}
              
              {/* Objectifs Individuels Techniques */}
              {selectedPlayer && objectifsIndividuels[selectedPlayer.id] && (
                <div className="mb-4">
                  <h4 className="font-medium text-blue-800 mb-2">Vos objectifs techniques :</h4>
                  <div className="bg-white p-3 rounded border-l-4 border-green-400">
                    <p className="text-gray-700 whitespace-pre-wrap">{objectifsIndividuels[selectedPlayer.id]}</p>
                  </div>
                </div>
              )}

              {/* AMÉLIORATION: Objectifs Mentaux */}
              {selectedPlayer && objectifsMentaux[selectedPlayer.id] && (
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Vos objectifs mentaux :</h4>
                  <div className="bg-white p-3 rounded border-l-4 border-purple-400">
                    <p className="text-gray-700 whitespace-pre-wrap">{objectifsMentaux[selectedPlayer.id]}</p>
                  </div>
                </div>
              )}
              
              {!objectifsCollectifs && (!selectedPlayer || !objectifsIndividuels[selectedPlayer.id]) && (!selectedPlayer || !objectifsMentaux[selectedPlayer.id]) && (
                <p className="text-gray-600 italic">Aucun objectif défini pour cette séance.</p>
              )}
            </div>

            {/* AMÉLIORATION: ScaleQuestion sans nombres pour les joueuses */}
            <ScaleQuestion
              question="Comment évaluez-vous votre motivation pour cette séance ?"
              value={preSessionForm.motivation}
              onChange={(value) => setPreSessionForm({...preSessionForm, motivation: value})}
              leftLabel="Très faible"
              rightLabel="Très élevée"
              showValue={false}  // Pas de nombres visibles
            />

            <ScaleQuestion
              question="Comment évaluez-vous votre niveau de fatigue ?"
              value={preSessionForm.fatigue}
              onChange={(value) => setPreSessionForm({...preSessionForm, fatigue: value})}
              leftLabel="Très fatigué"
              rightLabel="Très en forme"
              showValue={false}  // Pas de nombres visibles
            />

            <ScaleQuestion
              question="À quel point anticipez-vous prendre du plaisir durant cette séance ?"
              value={preSessionForm.plaisir}
              onChange={(value) => setPreSessionForm({...preSessionForm, plaisir: value})}
              leftLabel="Aucun plaisir"
              rightLabel="Énormément de plaisir"
              showValue={false}  // Pas de nombres visibles
            />

            <ScaleQuestion
              question="Comment évaluez-vous la difficulté des objectifs que vous vous fixez pour cette séance ?"
              value={preSessionForm.objectif_difficulte}
              onChange={(value) => setPreSessionForm({...preSessionForm, objectif_difficulte: value})}
              leftLabel="Très faciles"
              rightLabel="Très difficiles"
              showValue={false}  // Pas de nombres visibles
            />

            {/* AMÉLIORATION: Suivi des blessures intégré */}
            <InjuryComponent
              injuries={preSessionForm.injuries}
              onChange={(injuries) => setPreSessionForm({...preSessionForm, injuries})}
            />
          </div>

          <button
            onClick={saveQuestionnaire}
            disabled={loading}
            className="w-full mt-8 py-4 text-white rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50"
            style={{background: 'linear-gradient(135deg, #C09D5A 0%, #d4a574 100%)'}}
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreSessionQuestionnaire;
