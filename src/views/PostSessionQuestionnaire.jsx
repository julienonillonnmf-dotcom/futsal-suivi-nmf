// src/views/PostSessionQuestionnaire.jsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, MessageCircle } from 'lucide-react';
import ScaleQuestion from '../components/ScaleQuestion';
import { checkAndSendAlerts, sendFeedbackRequest } from '../services/alertService';

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
    activite: 'futsal',
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

  // État pour la demande de retour coach
  const [wantsFeedback, setWantsFeedback] = useState(false);

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
      // Ajouter wants_feedback dans les données
      const dataToSave = {
        ...postSessionForm,
        wants_feedback: wantsFeedback
      };
      
      const { error } = await supabase
        .from('responses')
        .insert({
          player_id: selectedPlayer.id,
          type: 'post',
          data: dataToSave
        });
      
      if (error) throw error;
      
      // Vérifier et envoyer les alertes Discord
      await checkAndSendAlerts(
        selectedPlayer.id,
        selectedPlayer.name,
        'post',
        postSessionForm
      );
      
      // Si demande de retour, envoyer la notification au coach
      if (wantsFeedback) {
        try {
          const result = await sendFeedbackRequest(selectedPlayer.id, selectedPlayer.name);
          if (result.success) {
            console.log(`✅ Notification envoyée à ${result.sent} admin(s)`);
          } else {
            console.log('⚠️ Erreur notification:', result.error);
          }
        } catch (notifError) {
          console.log('⚠️ Erreur notification (non bloquante):', notifError.message);
        }
      }
      
      alert('Questionnaire sauvegardé !');
      
      // Réinitialiser le formulaire
      setPostSessionForm({
        activite: 'futsal',
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
      setWantsFeedback(false);
      
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
            {/* Sélecteur d'activité */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border-2 border-purple-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                🏃 Type d'activité
              </label>
              <select
                value={postSessionForm.activite}
                onChange={(e) => setPostSessionForm({...postSessionForm, activite: e.target.value})}
                className="w-full p-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-base font-medium"
              >
                <option value="futsal">⚽ Futsal</option>
                <option value="foot">⚽ Football</option>
                <option value="autre">🏃 Autre</option>
              </select>
            </div>

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

            {/* Demande de retour du coach - Design amélioré */}
            <div 
              onClick={() => setWantsFeedback(!wantsFeedback)}
              className={`relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                wantsFeedback 
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg shadow-purple-200' 
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 hover:border-purple-400 hover:from-purple-50 hover:to-indigo-50'
              }`}
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Icône animée */}
                    <div className={`p-3 rounded-full transition-all duration-300 ${
                      wantsFeedback 
                        ? 'bg-white/20' 
                        : 'bg-purple-100'
                    }`}>
                      <MessageCircle 
                        className={`transition-all duration-300 ${
                          wantsFeedback ? 'text-white' : 'text-purple-500'
                        }`} 
                        size={28} 
                        fill={wantsFeedback ? 'currentColor' : 'none'}
                      />
                    </div>
                    
                    <div>
                      <h3 className={`text-lg font-bold transition-colors duration-300 ${
                        wantsFeedback ? 'text-white' : 'text-gray-700'
                      }`}>
                        {wantsFeedback ? '✨ Demande activée !' : '💬 Demander un retour coach'}
                      </h3>
                      <p className={`text-sm transition-colors duration-300 ${
                        wantsFeedback ? 'text-purple-100' : 'text-gray-500'
                      }`}>
                        {wantsFeedback 
                          ? 'Le coach sera notifié de ta demande' 
                          : 'Clique ici pour recevoir un feedback personnalisé'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Indicateur visuel */}
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                    wantsFeedback 
                      ? 'bg-white text-purple-600' 
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {wantsFeedback ? (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </div>
                </div>
                
                {/* Message de confirmation animé */}
                {wantsFeedback && (
                  <div className="mt-4 flex items-center bg-white/10 rounded-lg p-3 animate-pulse">
                    <span className="text-2xl mr-3">🔔</span>
                    <span className="text-white text-sm font-medium">
                      Super ! N'oublie pas de détailler tes questions dans les commentaires ci-dessus
                    </span>
                  </div>
                )}
              </div>
              
              {/* Effet de brillance au survol */}
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full transition-transform duration-700 ${
                wantsFeedback ? '' : 'group-hover:translate-x-full'
              }`} />
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
