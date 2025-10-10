// src/views/MatchQuestionnaire.jsx
import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import ScaleQuestion from '../components/ScaleQuestion';
import InjuryComponent from '../components/InjuryComponent';
import { checkAndSendAlerts } from '../services/alertService'; // 🆕 SYSTÈME D'ALERTES

const MatchQuestionnaire = ({ 
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
  
  const [matchForm, setMatchForm] = useState({
    activite: 'futsal',
    resultat: '',
    adversaire: '',
    score: '',
    temps_jeu: '',
    motivation: 10,
    fatigue: 10,
    intensite_rpe: 10,
    plaisir: 10,
    confiance: 10,
    technique: 10,
    tactique: 10,
    atteinte_objectifs: 10,
    influence_groupe: 10,
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
          type: 'match',
          data: matchForm
        });
      
      if (error) throw error;
      
      // 🆕 ALERTES DISCORD
      await checkAndSendAlerts(
        selectedPlayer.id,
        selectedPlayer.name,
        'match',
        matchForm
      );
      
      alert('Questionnaire sauvegardé !');
      
      // Réinitialiser le formulaire
      setMatchForm({
        activite: 'futsal',
        resultat: '',
        adversaire: '',
        score: '',
        temps_jeu: '',
        motivation: 10,
        fatigue: 10,
        intensite_rpe: 10,
        plaisir: 10,
        confiance: 10,
        technique: 10,
        tactique: 10,
        atteinte_objectifs: 10,
        influence_groupe: 10,
        injuries: [],
        commentaires_libres: ''
      });
      
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
              <h1 className="text-2xl font-bold" style={{color: '#1D2945'}}>Questionnaire Match</h1>
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
            {/* Type d'activité */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border-2 border-purple-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                🏃 Type de match
              </label>
              <select
                value={matchForm.activite}
                onChange={(e) => setMatchForm({...matchForm, activite: e.target.value})}
                className="w-full p-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-base font-medium"
              >
                <option value="futsal">⚽ Futsal</option>
                <option value="foot">⚽ Football</option>
              </select>
            </div>

            {/* Informations du match */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">📋 Informations du match</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Résultat du match
                </label>
                <select
                  value={matchForm.resultat}
                  onChange={(e) => setMatchForm({...matchForm, resultat: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                >
                  <option value="">Sélectionner...</option>
                  <option value="victoire">🏆 Victoire</option>
                  <option value="defaite">😞 Défaite</option>
                  <option value="nul">⚖️ Match nul</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adversaire
                </label>
                <input
                  type="text"
                  value={matchForm.adversaire}
                  onChange={(e) => setMatchForm({...matchForm, adversaire: e.target.value})}
                  placeholder="Nom de l'équipe adverse"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score
                </label>
                <input
                  type="text"
                  value={matchForm.score}
                  onChange={(e) => setMatchForm({...matchForm, score: e.target.value})}
                  placeholder="Ex: 3-2"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temps de jeu (minutes)
                </label>
                <input
                  type="number"
                  value={matchForm.temps_jeu}
                  onChange={(e) => setMatchForm({...matchForm, temps_jeu: e.target.value})}
                  placeholder="Ex: 45"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>

            {/* Rappel des objectifs */}
            {(objectifsCollectifs || objectifsIndividuels[selectedPlayer?.id] || objectifsMentaux[selectedPlayer?.id]) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3" style={{color: '#1D2945'}}>
                  🎯 Rappel de vos objectifs
                </h3>
                
                {objectifsCollectifs && (
                  <div className="mb-3">
                    <h4 className="font-medium text-blue-800 mb-2">Objectifs de l'équipe :</h4>
                    <div className="bg-white p-3 rounded border-l-4 border-blue-400">
                      <p className="text-gray-700 whitespace-pre-wrap text-sm">{objectifsCollectifs}</p>
                    </div>
                  </div>
                )}
                
                {objectifsIndividuels[selectedPlayer?.id] && (
                  <div className="mb-3">
                    <h4 className="font-medium text-blue-800 mb-2">Vos objectifs techniques :</h4>
                    <div className="bg-white p-3 rounded border-l-4 border-green-400">
                      <p className="text-gray-700 whitespace-pre-wrap text-sm">{objectifsIndividuels[selectedPlayer.id]}</p>
                    </div>
                  </div>
                )}

                {objectifsMentaux[selectedPlayer?.id] && (
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">Vos objectifs mentaux :</h4>
                    <div className="bg-white p-3 rounded border-l-4 border-purple-400">
                      <p className="text-gray-700 whitespace-pre-wrap text-sm">{objectifsMentaux[selectedPlayer.id]}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Évaluations */}
            <div className="border-t-2 border-gray-200 pt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">📊 Évaluations</h3>

              <ScaleQuestion
                question="Comment évaluez-vous votre motivation durant ce match ?"
                value={matchForm.motivation}
                onChange={(value) => setMatchForm({...matchForm, motivation: value})}
                leftLabel="Très faible"
                rightLabel="Très élevée"
                showValue={false}
              />

              <ScaleQuestion
                question="Comment évaluez-vous votre niveau de fatigue après ce match ?"
                value={matchForm.fatigue}
                onChange={(value) => setMatchForm({...matchForm, fatigue: value})}
                leftLabel="Très fatigué"
                rightLabel="Très en forme"
                showValue={false}
              />

              <ScaleQuestion
                question="Comment évaluez-vous l'intensité du match ? (RPE)"
                value={matchForm.intensite_rpe}
                onChange={(value) => setMatchForm({...matchForm, intensite_rpe: value})}
                leftLabel="Très faible"
                rightLabel="Très intense"
                showValue={false}
              />

              <ScaleQuestion
                question="À quel point avez-vous pris du plaisir durant ce match ?"
                value={matchForm.plaisir}
                onChange={(value) => setMatchForm({...matchForm, plaisir: value})}
                leftLabel="Aucun plaisir"
                rightLabel="Énormément de plaisir"
                showValue={false}
              />

              <ScaleQuestion
                question="Comment évaluez-vous votre niveau de confiance après ce match ?"
                value={matchForm.confiance}
                onChange={(value) => setMatchForm({...matchForm, confiance: value})}
                leftLabel="Très faible"
                rightLabel="Très élevé"
                showValue={false}
              />

              <ScaleQuestion
                question="Comment évaluez-vous votre performance technique durant ce match ?"
                value={matchForm.technique}
                onChange={(value) => setMatchForm({...matchForm, technique: value})}
                leftLabel="Très faible"
                rightLabel="Excellente"
                showValue={false}
              />

              <ScaleQuestion
                question="Comment évaluez-vous votre performance tactique durant ce match ?"
                value={matchForm.tactique}
                onChange={(value) => setMatchForm({...matchForm, tactique: value})}
                leftLabel="Très faible"
                rightLabel="Excellente"
                showValue={false}
              />

              <ScaleQuestion
                question="Pensez-vous avoir atteint vos objectifs pour ce match ?"
                value={matchForm.atteinte_objectifs}
                onChange={(value) => setMatchForm({...matchForm, atteinte_objectifs: value})}
                leftLabel="Pas du tout"
                rightLabel="Totalement"
                showValue={false}
              />

              <ScaleQuestion
                question="À quel point pensez-vous avoir influencé positivement le groupe ?"
                value={matchForm.influence_groupe}
                onChange={(value) => setMatchForm({...matchForm, influence_groupe: value})}
                leftLabel="Aucune influence"
                rightLabel="Très forte influence"
                showValue={false}
              />
            </div>

            {/* Suivi des blessures */}
            <InjuryComponent
              injuries={matchForm.injuries}
              onChange={(injuries) => setMatchForm({...matchForm, injuries})}
            />

            {/* Commentaires libres */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                💭 Commentaires libres (optionnel)
              </label>
              <textarea
                value={matchForm.commentaires_libres}
                onChange={(e) => setMatchForm({...matchForm, commentaires_libres: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                rows="4"
                placeholder="Partagez vos ressentis sur ce match, points positifs, axes d'amélioration..."
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

export default MatchQuestionnaire;
