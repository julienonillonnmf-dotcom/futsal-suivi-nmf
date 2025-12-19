// views/PlayerDetail.jsx
import React, { useState } from 'react';
import { ChevronLeft, Target, BarChart3, Users, Activity, MessageSquare } from 'lucide-react';
import PlayerFeedback from '../components/PlayerFeedback';

const PlayerDetail = ({ 
  selectedPlayer, 
  setCurrentView, 
  playerStats,
  objectifsIndividuels,
  objectifsMentaux,
  supabase
}) => {
  if (!selectedPlayer) return null;

  // State pour les onglets
  const [activeTab, setActiveTab] = useState('actions');

  return (
    <div className="min-h-screen p-4" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
      <div className="max-w-4xl mx-auto">
        {/* En-tête avec retour */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                {selectedPlayer.photo_url ? (
                  <img 
                    src={selectedPlayer.photo_url} 
                    alt={selectedPlayer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold" style={{background: 'linear-gradient(135deg, #1D2945 0%, #C09D5A 100%)'}}>
                    {selectedPlayer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{color: '#1D2945'}}>
                  {selectedPlayer.name}
                </h1>
                <p className="text-gray-600">
                  {playerStats[selectedPlayer.id]?.total_responses || 0} réponses totales
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentView('players')}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <ChevronLeft size={20} />
              <span>Retour</span>
            </button>
          </div>
        </div>

        {/* Navigation par onglets horizontaux */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="flex border-b flex-wrap">
            <button
              onClick={() => setActiveTab('actions')}
              className={`flex items-center justify-center space-x-2 px-6 py-4 font-semibold transition-all ${
                activeTab === 'actions'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-b-4 border-blue-600'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Target size={20} />
              <span>Questionnaires</span>
            </button>
            <button
              onClick={() => setActiveTab('retours')}
              className={`flex items-center justify-center space-x-2 px-6 py-4 font-semibold transition-all ${
                activeTab === 'retours'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-b-4 border-blue-600'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MessageSquare size={20} />
              <span>💬 Mes Retours</span>
            </button>
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="space-y-6">

          {/* ONGLET 1: ACTIONS RAPIDES - QUESTIONNAIRES */}
          {activeTab === 'actions' && (
            <>
              {/* Actions rapides avec nouveaux questionnaires */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <button
                  onClick={() => setCurrentView('pre-session')}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-105 text-left"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{backgroundColor: '#C09D5A'}}>
                      <Target className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold" style={{color: '#1D2945'}}>Questionnaire Pré-Séance</h3>
                      <p className="text-gray-600">Motivation, fatigue, objectifs</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentView('post-session')}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-105 text-left"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{backgroundColor: '#1D2945'}}>
                      <BarChart3 className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold" style={{color: '#1D2945'}}>Questionnaire Post-Séance</h3>
                      <p className="text-gray-600">RPE, ressenti, évaluation</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentView('match')}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-105 text-left"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-500">
                      <Users className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold" style={{color: '#1D2945'}}>Questionnaire Match</h3>
                      <p className="text-gray-600">Performance, confiance, stress</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentView('injury-followup')}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-105 text-left"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500">
                      <Activity className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold" style={{color: '#1D2945'}}>Suivi Blessure</h3>
                      <p className="text-gray-600">État des blessures actuelles</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Statistiques du joueur */}
              {playerStats[selectedPlayer.id] && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                  <h2 className="text-2xl font-bold mb-6" style={{color: '#1D2945'}}>Statistiques</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {playerStats[selectedPlayer.id].pre_session_responses}
                      </div>
                      <div className="text-sm text-gray-600">Pré-séances</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {playerStats[selectedPlayer.id].post_session_responses}
                      </div>
                      <div className="text-sm text-gray-600">Post-séances</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {playerStats[selectedPlayer.id].match_responses || 0}
                      </div>
                      <div className="text-sm text-gray-600">Matchs</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {playerStats[selectedPlayer.id].avg_motivation}
                      </div>
                      <div className="text-sm text-gray-600">Motivation moy.</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ONGLET 2: MES RETOURS - NOUVEL ONGLET AVEC LES RETOURS DU COACH */}
          {activeTab === 'retours' && (
            <PlayerFeedback 
              supabase={supabase}
              playerId={selectedPlayer.id}
              playerName={selectedPlayer.name}
              objectifsIndividuels={objectifsIndividuels[selectedPlayer.id] || ''}
              objectifsMentaux={objectifsMentaux[selectedPlayer.id] || ''}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default PlayerDetail;
