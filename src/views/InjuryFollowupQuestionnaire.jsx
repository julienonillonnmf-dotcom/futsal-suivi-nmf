// src/views/InjuryFollowupQuestionnaire.jsx
import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import InjuryComponent from '../components/InjuryComponent';
import { checkAndSendAlerts } from '../services/alertService'; // 🆕 SYSTÈME D'ALERTES

const InjuryFollowupQuestionnaire = ({ 
  selectedPlayer,
  setCurrentView,
  loading,
  setLoading,
  supabase,
  loadPlayers
}) => {
  
  const [injuryForm, setInjuryForm] = useState({
    activite: '',
    injuries: [],
    commentaires_libres: ''
  });

  const saveQuestionnaire = async () => {
    if (!selectedPlayer) return;
    
    if (!injuryForm.injuries || injuryForm.injuries.length === 0) {
      alert('⚠️ Veuillez ajouter au moins une blessure à suivre');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('responses')
        .insert({
          player_id: selectedPlayer.id,
          type: 'injury',
          data: injuryForm
        });
      
      if (error) throw error;
      
      // 🆕 ALERTES DISCORD
      await checkAndSendAlerts(
        selectedPlayer.id,
        selectedPlayer.name,
        'injury',
        injuryForm
      );
      
      alert('Suivi de blessure sauvegardé !');
      
      // Réinitialiser le formulaire
      setInjuryForm({
        activite: '',
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
              <h1 className="text-2xl font-bold text-red-600">🚑 Suivi de Blessure</h1>
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
            {/* Information */}
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <h3 className="text-sm font-bold text-red-800 mb-2">ℹ️ À propos du suivi des blessures</h3>
              <ul className="text-xs text-red-700 space-y-1">
                <li>• Utilisez ce formulaire pour signaler une nouvelle blessure ou mettre à jour une blessure existante</li>
                <li>• Le système envoie automatiquement une alerte au staff médical</li>
                <li>• Remplissez ce formulaire même en dehors des séances si nécessaire</li>
                <li>• En cas de blessure grave, consultez immédiatement un médecin</li>
              </ul>
            </div>

            {/* Contexte de la blessure */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Contexte</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quand la blessure est-elle survenue ?
                </label>
                <select
                  value={injuryForm.activite}
                  onChange={(e) => setInjuryForm({...injuryForm, activite: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                >
                  <option value="">Sélectionner...</option>
                  <option value="futsal">⚽ Pendant séance/match Futsal</option>
                  <option value="foot">⚽ Pendant séance/match Football</option>
                  <option value="autre">🏃 Pendant autre activité sportive</option>
                  <option value="quotidien">🏠 Dans la vie quotidienne</option>
                  <option value="inconnu">❓ Je ne sais pas / Douleur progressive</option>
                </select>
              </div>
            </div>

            {/* Composant de suivi des blessures */}
            <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
              <h3 className="text-lg font-semibold text-red-800 mb-4">🚑 Détails de la blessure</h3>
              <InjuryComponent
                injuries={injuryForm.injuries}
                onChange={(injuries) => setInjuryForm({...injuryForm, injuries})}
              />
            </div>

            {/* Commentaires libres */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                💭 Informations complémentaires
              </label>
              <textarea
                value={injuryForm.commentaires_libres}
                onChange={(e) => setInjuryForm({...injuryForm, commentaires_libres: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                rows="4"
                placeholder="Comment la blessure est-elle arrivée ? Avez-vous déjà consulté un professionnel ? Traitement en cours ? Autres détails importants..."
              />
            </div>

            {/* Message important */}
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
              <p className="text-sm text-orange-800">
                <strong>⚠️ Important :</strong> Ce questionnaire ne remplace pas un avis médical. 
                En cas de douleur intense, de gonflement important ou de doute, consultez rapidement un professionnel de santé.
              </p>
            </div>
          </div>

          <button
            onClick={saveQuestionnaire}
            disabled={loading || !injuryForm.injuries || injuryForm.injuries.length === 0}
            className="w-full mt-8 py-4 text-white rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}}
          >
            {loading ? 'Sauvegarde...' : '🚑 Enregistrer le suivi'}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Une alerte sera automatiquement envoyée au staff pour un suivi rapide
          </p>
        </div>
      </div>
    </div>
  );
};

export default InjuryFollowupQuestionnaire;
