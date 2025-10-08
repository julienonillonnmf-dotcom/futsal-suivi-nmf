// src/views/MatchQuestionnaire.jsx - NOUVEAU questionnaire

import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import ScaleQuestion from '../components/ScaleQuestion';
import InjuryComponent from '../components/InjuryComponent';

const MatchQuestionnaire = ({ 
  selectedPlayer,
  setCurrentView,
  loading,
  setLoading,
  supabase,
  loadPlayers
}) => {
  
  const [matchForm, setMatchForm] = useState({
    activite: 'futsal', // NOUVEAU CHAMP
    motivation: 10,
    confiance: 10,
    stress: 10,
    concentration: 10,
    performance_perçue: 10,
    satisfaction: 10,
    commentaires_libres: '',
    injuries: [],
    new_injury: false
  });

  const saveQuestionnaire = async () => {
    if (!selectedPlayer) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('responses')
        .insert({
          player_id: selectedPlayer.id,
          type: 'match',
          data: matchForm
        });
      
      if (error) throw error;
      
      alert('Questionnaire match sauvegardé !');
      
      // Réinitialiser le formulaire
      setMatchForm({
        activite: 'futsal', // NOUVEAU
        motivation: 10,
        confiance: 10,
        stress: 10,
        concentration: 10,
        performance_perçue: 10,
        satisfaction: 10,
        commentaires_libres: '',
        injuries: [],
        new_injury: false
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
                ⚽ Questionnaire Match
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
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border-2 border-purple-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                🏃 Type d'activité
              </label>
              <select
                value={matchForm.activite}
                onChange={(e) => setMatchForm({...matchForm, activite: e.target.value})}
                className="w-full p-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-base font-medium"
              >
                <option value="futsal">⚽ Futsal</option>
                <option value="foot">⚽ Football</option>
                <option value="autre">🏃 Autre</option>
              </select>
            </div>

            {/* Questions spécifiques aux matchs */}
            <ScaleQuestion
              question="A quel point étais-tu motivés pour ce match ?"
              value={matchForm.motivation}
              onChange={(value) => setMatchForm({...matchForm, motivation: value})}
              leftLabel="Très faible"
              rightLabel="Très élevée"
              showValue={false}
            />

            <ScaleQuestion
              question="Comment évalues-tu ton niveau de confiance avant le match?"
              value={matchForm.confiance}
              onChange={(value) => setMatchForm({...matchForm, confiance: value})}
              leftLabel="Très faible"
              rightLabel="Très élevée"
              showValue={false}
            />

            <ScaleQuestion
              question="Comment évalues-tu ton niveau de stress avant le match ?"
              value={matchForm.stress}
              onChange={(value) => setMatchForm({...matchForm, stress: value})}
              leftLabel="Très détendue"
              rightLabel="Très stressée"
              showValue={false}
            />

            <ScaleQuestion
              question="Comment évalues-tu ton niveau de concentration avant le match ?"
              value={matchForm.concentration}
              onChange={(value) => setMatchForm({...matchForm, concentration: value})}
              leftLabel="Très faible"
              rightLabel="Très élevée"
              showValue={false}
            />

            <ScaleQuestion
              question="Comment évalues-tu ta performance durant ce match ?"
              value={matchForm.performance_perçue}
              onChange={(value) => setMatchForm({...matchForm, performance_perçue: value})}
              leftLabel="Très mauvaise"
              rightLabel="Excellente"
              showValue={false}
            />

            <ScaleQuestion
              question="Es-tu satisfaite de ton match ?"
              value={matchForm.satisfaction}
              onChange={(value) => setMatchForm({...matchForm, satisfaction: value})}
              leftLabel="Pas du tout"
              rightLabel="Très satisfaite"
              showValue={false}
            />

            {/* AMÉLIORATION: Déclaration de blessures durant le match */}
            <InjuryComponent
              injuries={matchForm.injuries}
              onChange={(injuries) => setMatchForm({...matchForm, injuries})}
              showNewInjury={true}
            />

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Commentaires sur le match (optionnel)
              </label>
              <textarea
                value={matchForm.commentaires_libres}
                onChange={(e) => setMatchForm({...matchForm, commentaires_libres: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                rows="4"
                placeholder="Partagez vos impressions sur le match, les points positifs, ce qui peut être amélioré..."
              />
            </div>
          </div>

          <button
            onClick={saveQuestionnaire}
            disabled={loading}
            className="w-full mt-8 py-4 text-white rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50"
            style={{background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'}}
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder Match'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchQuestionnaire;
