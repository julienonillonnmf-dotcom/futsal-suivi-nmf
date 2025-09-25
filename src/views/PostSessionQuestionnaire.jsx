// views/PostSessionQuestionnaire.jsx
import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import ScaleQuestion from '../components/ScaleQuestion';
import InjuryComponent from '../components/InjuryComponent';

const PostSessionQuestionnaire = ({ 
  selectedPlayer,
  setCurrentView,
  loading,
  setLoading,
  supabase,
  loadPlayers
}) => {
  
  const [postSessionForm, setPostSessionForm] = useState({
    objectifs_repondu: 10,
    intensite_rpe: 10,
    plaisir_seance: 10,
    tactique: 10,
    technique: 10,
    influence_positive: 10,
    sentiment_groupe: 10,
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
          type: 'post',
          data: postSessionForm
        });
      
      if (error) throw error;
      
      alert('Questionnaire sauvegardé !');
      
      // Réinitialiser le formulaire
      setPostSessionForm({
        objectifs_repondu: 10,
        intensite_rpe: 10,
        plaisir_seance: 10,
        tactique: 10,
        technique: 10,
        influence_positive: 10,
        sentiment_groupe: 10,
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
              <h1 className="text-2xl font-bold" style={{color: '#1D2945'}}>Questionnaire Post-Séance</h1>
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
            <ScaleQuestion
              question="Dans quelle mesure vos objectifs ont-ils été atteints durant cette séance ?"
              value={postSessionForm.objectifs_repondu}
              onChange={(value) => setPostSessionForm({...postSessionForm, objectifs_repondu: value})}
              leftLabel="Pas du tout"
              rightLabel="Complètement"
            />

            <ScaleQuestion
              question="Comment évaluez-vous l'intensité de cette séance ? (RPE)"
              value={postSessionForm.intensite_rpe}
              onChange={(value) => setPostSessionForm({...postSessionForm, intensite_rpe: value})}
              leftLabel="Très facile"
              rightLabel="Très difficile"
            />

            <ScaleQuestion
              question="À quel point avez-vous pris du plaisir durant cette séance ?"
              value={postSessionForm.plaisir_seance}
              onChange={(value) => setPostSessionForm({...postSessionForm, plaisir_seance: value})}
              leftLabel="Aucun plaisir"
              rightLabel="Énormément de plaisir"
            />

            <ScaleQuestion
              question="Comment évaluez-vous vos progrès tactiques durant cette séance ?"
              value={postSessionForm.tactique}
              onChange={(value) => setPostSessionForm({...postSessionForm, tactique: value})}
              leftLabel="Aucun progrès"
              rightLabel="Énormes progrès"
            />

            <ScaleQuestion
              question="Comment évaluez-vous vos progrès techniques durant cette séance ?"
              value={postSessionForm.technique}
              onChange={(value) => setPostSessionForm({...postSessionForm, technique: value})}
              leftLabel="Aucun progrès"
              rightLabel="Énormes progrès"
            />

            <ScaleQuestion
              question="Dans quelle mesure avez-vous eu une influence positive sur le groupe ?"
              value={postSessionForm.influence_positive}
              onChange={(value) => setPostSessionForm({...postSessionForm, influence_positive: value})}
              leftLabel="Aucune influence"
              rightLabel="Très positive"
            />

            <ScaleQuestion
              question="Comment vous êtes-vous senti(e) dans le groupe durant cette séance ?"
              value={postSessionForm.sentiment_groupe}
              onChange={(value) => setPostSessionForm({...postSessionForm, sentiment_groupe: value})}
              leftLabel="Très mal intégré"
              rightLabel="Parfaitement intégré"
            />

            <InjuryComponent
              injuries={postSessionForm.injuries}
              onChange={(injuries) => setPostSessionForm({...postSessionForm, injuries})}
              showNewInjury={true}
            />

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Commentaires libres (optionnel)
              </label>
              <textarea
                value={postSessionForm.commentaires_libres}
                onChange={(e) => setPostSessionForm({...postSessionForm, commentaires_libres: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                rows="4"
                placeholder="Partagez vos impressions, suggestions ou remarques..."
              />
            </div>
          </div>

          <button
            onClick={saveQuestionnaire}
            disabled={loading}
            className="w-full mt-8 py-4 text-white rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50"
            style={{background: 'linear-gradient(135deg, #1D2945 0%, #2563eb 100%)'}}
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostSessionQuestionnaire;
