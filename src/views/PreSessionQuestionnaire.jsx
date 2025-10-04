// views/PreSessionQuestionnaire.jsx - Avec question cycle menstruel
import React, { useState } from 'react';
import { ChevronLeft, Send } from 'lucide-react';
import ScaleQuestion from '../components/ScaleQuestion';

const PreSessionQuestionnaire = ({
  selectedPlayer,
  setCurrentView,
  loading,
  setLoading,
  loadPlayers,
  supabase
}) => {
  const [responses, setResponses] = useState({
    motivation: null,
    fatigue: null,
    sommeil: null,
    stress: null,
    douleurs_actuelles: null,
    cycle_menstruel: null // null = non répondu, true = oui, false = non
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérifier que toutes les questions obligatoires sont remplies
    if (responses.motivation === null || responses.fatigue === null) {
      alert('Veuillez répondre à toutes les questions obligatoires (Motivation et Fatigue)');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('responses')
        .insert({
          player_id: selectedPlayer.id,
          type: 'pre',
          data: responses
        });

      if (error) throw error;

      alert('Questionnaire pré-séance enregistré avec succès !');
      await loadPlayers();
      setCurrentView('player-detail');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement du questionnaire');
    }
    setLoading(false);
  };

  const handleCycleMenstruelChange = (value) => {
    setResponses(prev => ({
      ...prev,
      cycle_menstruel: value
    }));
  };

  return (
    <div className="min-h-screen p-4" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentView('player-detail')}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
            >
              <ChevronLeft size={20} />
              <span>Retour</span>
            </button>
            <h1 className="text-2xl font-bold" style={{color: '#1D2945'}}>
              Questionnaire Pré-Séance
            </h1>
            <div className="w-24"></div>
          </div>

          <div className="text-center mb-6">
            <p className="text-gray-600">Joueuse: <strong>{selectedPlayer?.name}</strong></p>
            <p className="text-sm text-gray-500">Avant la séance d'entraînement</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <ScaleQuestion
              question="Comment évaluez-vous votre motivation aujourd'hui ?"
              emoji="🔥"
              min="Très faible"
              max="Très élevée"
              value={responses.motivation}
              onChange={(value) => setResponses(prev => ({ ...prev, motivation: value }))}
              color="#2563eb"
              required
            />
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <ScaleQuestion
              question="Comment vous sentez-vous aujourd'hui ?"
              emoji="😴"
              min="Très fatiguée"
              max="En pleine forme"
              value={responses.fatigue}
              onChange={(value) => setResponses(prev => ({ ...prev, fatigue: value }))}
              color="#dc2626"
              required
              reversed
            />
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <ScaleQuestion
              question="Combien d'heures avez-vous dormi cette nuit ?"
              emoji="😴"
              min="Très peu (0-4h)"
              max="Beaucoup (9h+)"
              value={responses.sommeil}
              onChange={(value) => setResponses(prev => ({ ...prev, sommeil: value }))}
              color="#8b5cf6"
            />
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <ScaleQuestion
              question="Quel est votre niveau de stress aujourd'hui ?"
              emoji="😰"
              min="Aucun stress"
              max="Très stressée"
              value={responses.stress}
              onChange={(value) => setResponses(prev => ({ ...prev, stress: value }))}
              color="#f59e0b"
            />
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <ScaleQuestion
              question="Avez-vous des douleurs ou gênes actuellement ?"
              emoji="😣"
              min="Aucune douleur"
              max="Douleurs importantes"
              value={responses.douleurs_actuelles}
              onChange={(value) => setResponses(prev => ({ ...prev, douleurs_actuelles: value }))}
              color="#ec4899"
            />
          </div>

          {/* Question Cycle Menstruel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2" style={{color: '#1D2945'}}>
                🩺 Êtes-vous actuellement en période de menstruations ?
              </h3>
              <p className="text-sm text-gray-500">Cette information aide à personnaliser le suivi</p>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <button
                type="button"
                onClick={() => handleCycleMenstruelChange(true)}
                className={`px-8 py-4 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  responses.cycle_menstruel === true
                    ? 'bg-pink-500 text-white shadow-lg scale-105'
                    : responses.cycle_menstruel === false
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <span className="text-2xl mb-2 block">✓</span>
                Oui
              </button>

              <button
                type="button"
                onClick={() => handleCycleMenstruelChange(null)}
                className={`px-6 py-4 rounded-lg font-medium transition-all ${
                  responses.cycle_menstruel === null
                    ? 'bg-gray-400 text-white'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                <span className="text-sm">Pas de réponse</span>
              </button>

              <button
                type="button"
                onClick={() => handleCycleMenstruelChange(false)}
                className={`px-8 py-4 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  responses.cycle_menstruel === false
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : responses.cycle_menstruel === true
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <span className="text-2xl mb-2 block">✗</span>
                Non
              </button>
            </div>

            {responses.cycle_menstruel !== null && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Réponse sélectionnée: <strong>{responses.cycle_menstruel ? 'Oui' : 'Non'}</strong>
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <button
              type="submit"
              disabled={loading || responses.motivation === null || responses.fatigue === null}
              className="w-full flex items-center justify-center space-x-2 px-6 py-4 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'}}
            >
              <Send size={20} />
              <span>{loading ? 'Envoi en cours...' : 'Envoyer le questionnaire'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreSessionQuestionnaire;
