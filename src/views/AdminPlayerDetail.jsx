// views/AdminPlayerDetail.jsx
import React from 'react';
import { ChevronLeft, AlertTriangle, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminPlayerDetail = ({ 
  selectedPlayer,
  setCurrentView,
  playerStats,
  objectifsIndividuels,
  objectifsMentaux
}) => {
  
  if (!selectedPlayer) return null;

  const chartData = playerStats[selectedPlayer.id]?.chartData || [];

  return (
    <div className="min-h-screen p-4" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
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
                  {selectedPlayer.name} - Vue Entraîneur
                </h1>
                <p className="text-gray-600">
                  {playerStats[selectedPlayer.id]?.total_responses || 0} réponses totales
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentView('admin')}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <ChevronLeft size={20} />
              <span>Retour Admin</span>
            </button>
          </div>
        </div>

        {/* Graphiques d'évolution */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-6" style={{color: '#1D2945'}}>Évolution des Métriques</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphique Motivation */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-blue-600">Motivation</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData.filter(d => d.motivation)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 20]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="motivation" stroke="#2563eb" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Graphique RPE */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-red-600">RPE (Intensité)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData.filter(d => d.intensite_rpe)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 20]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="intensite_rpe" stroke="#dc2626" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Graphique Plaisir */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-yellow-600">Plaisir</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData.filter(d => d.plaisir || d.plaisir_seance)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 20]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="plaisir" stroke="#eab308" strokeWidth={2} />
                    <Line type="monotone" dataKey="plaisir_seance" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Graphique Fatigue */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-purple-600">Fatigue</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData.filter(d => d.fatigue)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 20]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="fatigue" stroke="#9333ea" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Statistiques détaillées */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4" style={{color: '#1D2945'}}>Statistiques</h2>
              {playerStats[selectedPlayer.id] && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {playerStats[selectedPlayer.id].pre_session_responses}
                    </div>
                    <div className="text-sm text-gray-600">Questionnaires pré-séance</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {playerStats[selectedPlayer.id].post_session_responses}
                    </div>
                    <div className="text-sm text-gray-600">Questionnaires post-séance</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {playerStats[selectedPlayer.id].match_responses || 0}
                    </div>
                    <div className="text-sm text-gray-600">Questionnaires match</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">
                      {playerStats[selectedPlayer.id].avg_motivation}/20
                    </div>
                    <div className="text-sm text-gray-600">Motivation moyenne</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      {playerStats[selectedPlayer.id].avg_fatigue}/20
                    </div>
                    <div className="text-sm text-gray-600">Fatigue moyenne</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {playerStats[selectedPlayer.id].avg_rpe}/20
                    </div>
                    <div className="text-sm text-gray-600">RPE moyen</div>
                  </div>
                </div>
              )}
            </div>

            {/* Objectifs personnels */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4" style={{color: '#1D2945'}}>Objectifs Personnels</h2>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 text-sm mb-1">Techniques</h4>
                  <p className="text-gray-700 text-sm">
                    {objectifsIndividuels[selectedPlayer.id] || 'Aucun objectif technique défini.'}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 text-sm mb-1">Mentaux</h4>
                  <p className="text-gray-700 text-sm">
                    {objectifsMentaux[selectedPlayer.id] || 'Aucun objectif mental défini.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Historique des réponses détaillé */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-6" style={{color: '#1D2945'}}>
                Historique Complet des Réponses
              </h2>
              
              {selectedPlayer.responses && selectedPlayer.responses.length > 0 ? (
                <div className="space-y-6">
                  {selectedPlayer.responses.map(response => (
                    <div key={response.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg" style={{color: '#1D2945'}}>
                            {response.type === 'pre' && '📋 Pré-séance'}
                            {response.type === 'post' && '📊 Post-séance'}
                            {response.type === 'match' && '⚽ Match'}
                            {response.type === 'injury' && '🏥 Suivi blessure'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(response.created_at).toLocaleDateString('fr-FR')} à {new Date(response.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                          </p>
                        </div>
                      </div>

                      {/* Détail des réponses avec suivi blessures */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {response.type === 'pre' && (
                          <>
                            {response.data.motivation && (
                              <div className="bg-blue-50 p-2 rounded">
                                <div className="text-xs text-gray-600">Motivation</div>
                                <div className="font-semibold text-blue-700">{response.data.motivation}/20</div>
                              </div>
                            )}
                            {response.data.fatigue && (
                              <div className="bg-red-50 p-2 rounded">
                                <div className="text-xs text-gray-600">Fatigue</div>
                                <div className="font-semibold text-red-700">{response.data.fatigue}/20</div>
                              </div>
                            )}
                            {response.data.plaisir && (
                              <div className="bg-yellow-50 p-2 rounded">
                                <div className="text-xs text-gray-600">Plaisir anticipé</div>
                                <div className="font-semibold text-yellow-700">{response.data.plaisir}/20</div>
                              </div>
                            )}
                          </>
                        )}

                        {response.type === 'post' && (
                          <>
                            {response.data.objectifs_repondu && (
                              <div className="bg-green-50 p-2 rounded">
                                <div className="text-xs text-gray-600">Objectifs atteints</div>
                                <div className="font-semibold text-green-700">{response.data.objectifs_repondu}/20</div>
                              </div>
                            )}
                            {response.data.intensite_rpe && (
                              <div className="bg-red-50 p-2 rounded">
                                <div className="text-xs text-gray-600">RPE</div>
                                <div className="font-semibold text-red-700">{response.data.intensite_rpe}/20</div>
                              </div>
                            )}
                            {response.data.plaisir_seance && (
                              <div className="bg-yellow-50 p-2 rounded">
                                <div className="text-xs text-gray-600">Plaisir</div>
                                <div className="font-semibold text-yellow-700">{response.data.plaisir_seance}/20</div>
                              </div>
                            )}
                            {response.data.tactique && (
                              <div className="bg-blue-50 p-2 rounded">
                                <div className="text-xs text-gray-600">Progrès tactique</div>
                                <div className="font-semibold text-blue-700">{response.data.tactique}/20</div>
                              </div>
                            )}
                            {response.data.technique && (
                              <div className="bg-indigo-50 p-2 rounded">
                                <div className="text-xs text-gray-600">Progrès technique</div>
                                <div className="font-semibold text-indigo-700">{response.data.technique}/20</div>
                              </div>
                            )}
                          </>
                        )}

                        {response.type === 'match' && (
                          <>
                            {response.data.motivation && (
                              <div className="bg-blue-50 p-2 rounded">
                                <div className="text-xs text-gray-600">Motivation</div>
                                <div className="font-semibold text-blue-700">{response.data.motivation}/20</div>
                              </div>
                            )}
                            {response.data.confiance && (
                              <div className="bg-green-50 p-2 rounded">
                                <div className="text-xs text-gray
