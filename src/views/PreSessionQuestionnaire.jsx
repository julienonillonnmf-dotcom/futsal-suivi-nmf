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
  objectifsMentaux,
  loading,
  setLoading,
  supabase,
  loadPlayers
}) => {
  
  const [preSessionForm, setPreSessionForm] = useState({
    activite: 'futsal', // NOUVEAU CHAMP
    motivation: 10,
    fatigue: 10,
    plaisir: 10,
    objectif_difficulte: 10,
    objectifs_personnels: '',
    commentaires_libres: '',
    injuries: [],
    cycle_phase: '',
    cycle_impact: 10
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
        activite: 'futsal', // NOUVEAU
        motivation: 10,
        fatigue: 10,
        plaisir: 10,
        objectif_difficulte: 10,
        objectifs_personnels: '',
        commentaires_libres: '',
        injuries: [],
        cycle_phase: '',
        cycle_impact: 10
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
            {/* NOUVEAU : Sélecteur d'activité */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border-2 border-purple-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                🏃 Type d'activité
              </label>
              <select
                value={preSessionForm.activite}
                onChange={(e) => setPreSessionForm({...preSessionForm, activite: e.target.value})}
                className="w-full p-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-base font-medium"
              >
                <option value="futsal">⚽ Futsal</option>
                <option value="foot">⚽ Football</option>
                <option value="autre">🏃 Autre</option>
              </select>
            </div>

            {/* Affichage des objectifs existants */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3" style={{color: '#1D2945'}}>
                🎯 Objectifs définis par l'encadrement
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
                  <h4 className="font-medium text-blue-800 mb-2">Vos objectifs personnels :</h4>
                  <div className="bg-white p-3 rounded border-l-4 border-green-400">
                    <p className="text-gray-700 whitespace-pre-wrap">{objectifsIndividuels[selectedPlayer.id]}</p>
                  </div>
                </div>
              )}

              {/* Objectifs Mentaux */}
              {selectedPlayer && objectifsMentaux[selectedPlayer.id] && (
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Vos objectifs mentaux :</h4>
                  <div className="bg-white p-3 rounded border-l-4 border-purple-400">
                    <p className="text-gray-700 whitespace-pre-wrap">{objectifsMentaux[selectedPlayer.id]}</p>
                  </div>
                </div>
              )}
              
              {!objectifsCollectifs && (!selectedPlayer || !objectifsIndividuels[selectedPlayer.id]) && (!selectedPlayer || !objectifsMentaux[selectedPlayer.id]) && (
                <p className="text-gray-600 italic">Aucun objectif défini par l'encadrement pour cette séance.</p>
              )}
            </div>

            {/* Objectifs personnels pour cette séance */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                🎯 Vos objectifs personnels pour cette séance
              </label>
              <textarea
                value={preSessionForm.objectifs_personnels}
                onChange={(e) => setPreSessionForm({...preSessionForm, objectifs_personnels: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                rows="3"
                placeholder="Quels sont vos objectifs personnels pour cette séance ? (ex: améliorer mes passes, être plus vocal, rester concentrée...)"
              />
            </div>

            <ScaleQuestion
              question="Comment évaluez-vous votre motivation pour cette séance ?"
              value={preSessionForm.motivation}
              onChange={(value) => setPreSessionForm({...preSessionForm, motivation: value})}
              leftLabel="Très faible"
              rightLabel="Très élevée"
              showValue={false}
            />

            <ScaleQuestion
              question="Comment évaluez-vous votre niveau de fatigue ?"
              value={preSessionForm.fatigue}
              onChange={(value) => setPreSessionForm({...preSessionForm, fatigue: value})}
              leftLabel="Très fatigué"
              rightLabel="Très en forme"
              showValue={false}
            />

            <ScaleQuestion
              question="À quel point anticipez-vous prendre du plaisir durant cette séance ?"
              value={preSessionForm.plaisir}
              onChange={(value) => setPreSessionForm({...preSessionForm, plaisir: value})}
              leftLabel="Aucun plaisir"
              rightLabel="Énormément de plaisir"
              showValue={false}
            />

            <ScaleQuestion
              question="Comment évaluez-vous la difficulté des objectifs que fixez pour cette séance ?"
              value={preSessionForm.objectif_difficulte}
              onChange={(value) => setPreSessionForm({...preSessionForm, objectif_difficulte: value})}
              leftLabel="Très faciles"
              rightLabel="Très difficiles"
              showValue={false}
            />

            {/* NOUVELLE SECTION : Cycle menstruel */}
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-pink-800 mb-4">
                🌸 Suivi du cycle menstruel (optionnel et confidentiel)
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avez-vous vos règles actuellement ?
                </label>
                <select
                  value={preSessionForm.cycle_phase}
                  onChange={(e) => setPreSessionForm({...preSessionForm, cycle_phase: e.target.value})}
                  className="w-full p-3 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                >
                  <option value="">Je ne souhaite pas répondre</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                </select>
                <p className="text-xs text-gray-500 mt-2 italic">
                  Cette information aide le staff à adapter l'entraînement à votre physiologie
                </p>
              </div>

              {preSessionForm.cycle_phase && preSessionForm.cycle_phase !== '' && (
                <div>
                  <ScaleQuestion
                    question="Impact perçu du cycle sur votre état physique aujourd'hui"
                    value={preSessionForm.cycle_impact}
                    onChange={(value) => setPreSessionForm({...preSessionForm, cycle_impact: value})}
                    leftLabel="Impact très négatif"
                    rightLabel="Aucun impact / positif"
                    showValue={false}
                  />
                  <p className="text-xs text-gray-500 mt-2 italic">
                    10 = neutre (ni impact positif ni négatif)
                  </p>
                </div>
              )}
            </div>

            {/* Suivi des blessures */}
            <InjuryComponent
              injuries={preSessionForm.injuries}
              onChange={(injuries) => setPreSessionForm({...preSessionForm, injuries})}
            />

            {/* Zone de commentaires libres */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                💭 Commentaires libres (optionnel)
              </label>
              <textarea
                value={preSessionForm.commentaires_libres}
                onChange={(e) => setPreSessionForm({...preSessionForm, commentaires_libres: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                rows="4"
                placeholder="Partagez votre état d'esprit, vos attentes, remarques ou questions pour cette séance..."
              />
            </div>
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
