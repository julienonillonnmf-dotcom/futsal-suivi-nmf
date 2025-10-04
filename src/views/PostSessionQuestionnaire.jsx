// src/views/PostSessionQuestionnaire.jsx

import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import ScaleQuestion from '../components/ScaleQuestion';

const PostSessionQuestionnaire = ({ 
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
  
  const [postSessionForm, setPostSessionForm] = useState({
    intensite_rpe: 10,
    plaisir_seance: 10,
    confiance: 10,
    technique: 10,
    tactique: 10,
    atteinte_objectifs: 10,
    influence_groupe: 10,
    objectifs_atteints: '',
    commentaires_libres: ''
  });

  const [preSessionObjectives, setPreSessionObjectives] = useState({
    motivation: null,
    fatigue: null,
    objectifs_personnels: ''
  });

  // Récupérer la dernière réponse pré-séance pour afficher les objectifs personnels
  useEffect(() => {
    const fetchLastPreSession = async () => {
      if (!selectedPlayer) return;
      
      try {
        const { data, error } = await supabase
          .from('responses')
          .select('*')
          .eq('player_id', selectedPlayer.id)
          .eq('type', 'pre')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const lastPreSession = data[0];
          setPreSessionObjectives({
            motivation: lastPreSession.data?.motivation || null,
            fatigue: lastPreSession.data?.fatigue || null,
            objectifs_personnels: lastPreSession.data?.objectifs_personnels || ''
          });
        }
      } catch (error) {
        console.error('Erreur récupération pré-séance:', error);
      }
    };
    
    fetchLastPreSession();
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
        intensite_rpe: 10,
        plaisir_seance: 10,
        confiance: 10,
        technique: 10,
        tactique: 10,
        atteinte_objectifs: 10,
        influence_groupe: 10,
        objectifs_atteints: '',
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
            {/* Rappel de TOUS les objectifs du début de séance */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3" style={{color: '#1D2945'}}>
                🎯 Rappel de vos objectifs du début de séance
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

              {/* Objectifs Mentaux */}
              {selectedPlayer && objectifsMentaux[selectedPlayer.id] && (
                <div className="mb-4">
                  <h4 className="font-medium text-blue-800 mb-2">Vos objectifs mentaux :</h4>
                  <div className="bg-white p-3 rounded border-l-4 border-purple-400">
                    <p className="text-gray-700 whitespace-pre-wrap">{objectifsMentaux[selectedPlayer.id]}</p>
                  </div>
                </div>
              )}

              {/* Objectifs Personnels saisis dans le pré-séance */}
              {preSessionObjectives.objectifs_personnels && (
                <div className="mb-4">
                  <h4 className="font-medium text-blue-800 mb-2">Vos objectifs personnels :</h4>
                  <div className="bg-white p-3 rounded border-l-4 border-yellow-400">
                    <p className="text-gray-700 whitespace-pre-wrap">{preSessionObjectives.objectifs_personnels}</p>
                  </div>
                </div>
              )}

              {/* État initial (motivation et forme) */}
              {(preSessionObjectives.motivation || preSessionObjectives.fatigue) && (
                <div className="mb-2">
                  <h4 className="font-medium text-blue-800 mb-2">Votre état en début de séance :</h4>
                  <div className="bg-white p-3 rounded border-l-4 border-gray-400">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {preSessionObjectives.motivation && (
                        <p className="text-gray-700">
                          <span className="font-semibold">Motivation initiale :</span> {preSessionObjectives.motivation}/20
                        </p>
                      )}
                      {preSessionObjectives.fatigue && (
                        <p className="text-gray-700">
                          <span className="font-semibold">Niveau de forme initial :</span> {preSessionObjectives.fatigue}/20
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {!objectifsCollectifs && 
               (!selectedPlayer || !objectifsIndividuels[selectedPlayer.id]) && 
               (!selectedPlayer || !objectifsMentaux[selectedPlayer.id]) && 
               !preSessionObjectives.objectifs_personnels && (
                <p className="text-gray-600 italic">Aucun objectif n'avait été défini pour cette séance.</p>
              )}
            </div>

            <ScaleQuestion
              question="Comment évaluez-vous l'intensité de la séance ? (RPE - Rating of Perceived Exertion)"
              value={postSessionForm.intensite_rpe}
              onChange={(value) => setPostSessionForm({...postSessionForm, intensite_rpe: value})}
              leftLabel="Très faible"
              rightLabel="Très intense"
              showValue={false}
            />

            <ScaleQuestion
              question="À quel point avez-vous pris du plaisir durant cette séance ?"
              value={postSessionForm.plaisir_seance}
              onChange={(value) => setPostSessionForm({...postSessionForm, plaisir_seance: value})}
              leftLabel="Aucun plaisir"
              rightLabel="Énormément de plaisir"
              showValue={false}
            />

            <ScaleQuestion
              question="Comment évaluez-vous votre niveau de confiance après cette séance ?"
              value={postSessionForm.confiance}
              onChange={(value) => setPostSessionForm({...postSessionForm, confiance: value})}
              leftLabel="Très faible"
              rightLabel="Très élevé"
              showValue={false}
            />

            <ScaleQuestion
              question="Comment évaluez-vous votre performance technique durant cette séance ?"
              value={postSessionForm.technique}
              onChange={(value) => setPostSessionForm({...postSessionForm, technique: value})}
              leftLabel="Très faible"
              rightLabel="Excellente"
              showValue={false}
            />

            <ScaleQuestion
              question="Comment évaluez-vous votre performance tactique durant cette séance ?"
              value={postSessionForm.tactique}
              onChange={(value) => setPostSessionForm({...postSessionForm, tactique: value})}
              leftLabel="Très faible"
              rightLabel="Excellente"
              showValue={false}
            />

            <ScaleQuestion
              question="Pensez-vous avoir atteint vos objectifs pour cette séance ?"
              value={postSessionForm.atteinte_objectifs}
              onChange={(value) => setPostSessionForm({...postSessionForm, atteinte_objectifs: value})}
              leftLabel="Pas du tout"
              rightLabel="Totalement"
              showValue={false}
            />

            <ScaleQuestion
              question="À quel point penses-tu avoir influencé positivement le groupe sur cette séance ?"
              value={postSessionForm.influence_groupe}
              onChange={(value) => setPostSessionForm({...postSessionForm, influence_groupe: value})}
              leftLabel="Aucune influence"
              rightLabel="Très forte influence"
              showValue={false}
            />

            {/* Objectifs atteints - description */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                ✅ Détaillez l'atteinte de vos objectifs (optionnel)
              </label>
              <textarea
                value={postSessionForm.objectifs_atteints}
                onChange={(e) => setPostSessionForm({...postSessionForm, objectifs_atteints: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                rows="3"
                placeholder="Décrivez dans quelle mesure vous avez atteint vos objectifs (ex: j'ai réussi à améliorer mes passes courtes, j'ai été plus vocale...)"
              />
            </div>

            {/* Commentaires libres */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                💭 Commentaires libres (optionnel)
              </label>
              <textarea
                value={postSessionForm.commentaires_libres}
                onChange={(e) => setPostSessionForm({...postSessionForm, commentaires_libres: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                rows="4"
                placeholder="Partagez vos ressentis généraux, remarques ou questions sur cette séance..."
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

export default PostSessionQuestionnaire;
