// views/PostSessionQuestionnaire.jsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Target, Clock } from 'lucide-react';
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

  const [preSessionObjectives, setPreSessionObjectives] = useState(null);
  const [loadingObjectives, setLoadingObjectives] = useState(true);

  // Récupérer les objectifs définis en pré-séance du jour
  useEffect(() => {
    const loadPreSessionObjectives = async () => {
      if (!selectedPlayer) return;
      
      setLoadingObjectives(true);
      
      try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

        const { data, error } = await supabase
          .from('responses')
          .select('*')
          .eq('player_id', selectedPlayer.id)
          .eq('type', 'pre')
          .gte('created_at', startOfDay)
          .lte('created_at', endOfDay)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          setPreSessionObjectives(data[0].data);
        } else {
          setPreSessionObjectives(null);
        }

      } catch (error) {
        console.error('Erreur chargement objectifs pré-séance:', error);
        setPreSessionObjectives(null);
      }
      
      setLoadingObjectives(false);
    };

    loadPreSessionObjectives();
  }, [selectedPlayer, supabase]);

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

          {/* Rappel des objectifs de pré-séance */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-3">
              <Target className="text-green-600 mr-2" size={20} />
              <h3 className="text-lg font-semibold" style={{color: '#1D2945'}}>
                Rappel de vos objectifs du début de séance
              </h3>
            </div>
            
            {loadingObjectives ? (
              <div className="flex items-center text-gray-600">
                <Clock className="mr-2" size={16} />
                <span>Chargement de vos objectifs...</span>
              </div>
            ) : preSessionObjectives ? (
              <div className="space-y-3">
                {/* Objectifs personnels définis en pré-séance */}
                {preSessionObjectives.objectifs_personnels && (
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">Vos objectifs personnels :</h4>
                    <div className="bg-white p-3 rounded border-l-4 border-green-400">
                      <p className="text-gray-700 whitespace-pre-wrap">{preSessionObjectives.objectifs_personnels}</p>
                    </div>
                  </div>
                )}

                {/* Informations contextuelles de pré-séance */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {preSessionObjectives.motivation && (
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm text-gray-600">Motivation initiale</p>
                      <p className="font-medium text-blue-600">{preSessionObjectives.motivation}/20</p>
                    </div>
                  )}
                  {preSessionObjectives.fatigue && (
                    <div className="bg-white p-3 rounded">
                      <p className="text-sm text-gray-600">Niveau de forme initial</p>
                      <p className="font-medium text-green-600">{preSessionObjectives.fatigue}/20</p>
                    </div>
                  )}
                </div>

                {/* Commentaires de pré-séance */}
                {preSessionObjectives.commentaires_libres && (
                  <div className="mt-4">
                    <h4 className="font-medium text-green-800 mb-2">Vos commentaires du début de séance :</h4>
                    <div className="bg-white p-3 rounded border-l-4 border-blue-400">
                      <p className="text-gray-700 italic">"{preSessionObjectives.commentaires_libres}"</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-600 italic">
                Aucun questionnaire pré-séance trouvé pour aujourd'hui. Vous pouvez tout de même remplir ce questionnaire post-séance.
              </div>
            )}
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
                placeholder="Partagez vos impressions, suggestions ou remarques sur cette séance..."
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
