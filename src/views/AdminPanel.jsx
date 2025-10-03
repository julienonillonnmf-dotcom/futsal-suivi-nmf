// views/AdminPanel.jsx - Version complète avec filtre de période
import React, { useState } from 'react';
import { ChevronLeft, Edit3, UserPlus, Download, Trash2, Filter, TrendingUp, BarChart3, Users, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { resizeImage } from '../utils/imageUtils';

const AdminPanel = ({ 
  players,
  setPlayers,
  setSelectedPlayer,
  setCurrentView,
  loading,
  setLoading,
  playerStats,
  objectifsCollectifs,
  setObjectifsCollectifs,
  objectifsIndividuels,
  setObjectifsIndividuels,
  objectifsMentaux,
  setObjectifsMentaux,
  loadPlayers,
  supabase
}) => {
  
  const [editingObjectives, setEditingObjectives] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState(['motivation']);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState(['all']);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const metricsOptions = [
    { value: 'motivation', label: 'Motivation', color: '#2563eb' },
    { value: 'fatigue', label: 'Fatigue', color: '#dc2626' },
    { value: 'intensite_rpe', label: 'RPE (Intensité)', color: '#f59e0b' },
    { value: 'plaisir', label: 'Plaisir', color: '#10b981' },
    { value: 'confiance', label: 'Confiance', color: '#8b5cf6' },
    { value: 'technique', label: 'Technique', color: '#ec4899' },
    { value: 'tactique', label: 'Tactique', color: '#6366f1' }
  ];

  const questionTypeOptions = [
    { value: 'all', label: 'Tous les questionnaires' },
    { value: 'pre', label: 'Pré-séance' },
    { value: 'post', label: 'Post-séance' },
    { value: 'match', label: 'Match' },
    { value: 'injury', label: 'Blessures' }
  ];

  const getUnifiedChartData = () => {
    if (selectedMetrics.length === 0) {
      return { chartData: [], globalAverages: {}, filteredAverages: {} };
    }

    const playersToAnalyze = selectedPlayers.length > 0 
      ? players.filter(p => selectedPlayers.includes(p.id))
      : players;

    const allDates = new Set();
    const dateResponses = {};
    
    playersToAnalyze.forEach(player => {
      const responses = player.responses || [];
      let filteredResponses = responses;
      
      if (!selectedQuestionTypes.includes('all')) {
        filteredResponses = responses.filter(r => selectedQuestionTypes.includes(r.type));
      }
      
      filteredResponses.forEach(response => {
        const responseDate = new Date(response.created_at);
        
        if (startDate && new Date(startDate) > responseDate) return;
        if (endDate && new Date(endDate) < responseDate) return;
        
        const date = responseDate.toLocaleDateString('fr-FR');
        allDates.add(date);
        
        if (!dateResponses[date]) {
          dateResponses[date] = [];
        }
        dateResponses[date].push(response);
      });
    });

    const sortedDates = Array.from(allDates).sort((a, b) => {
      const dateA = new Date(a.split('/').reverse().join('-'));
      const dateB = new Date(b.split('/').reverse().join('-'));
      return dateA - dateB;
    });

    const chartData = sortedDates.map(date => {
      const dataPoint = { date };
      
      selectedMetrics.forEach(metric => {
        const responsesForDate = dateResponses[date] || [];
        const valuesForMetric = responsesForDate
          .map(r => r.data?.[metric])
          .filter(v => v != null && !isNaN(v))
          .map(v => Number(v));
        
        if (valuesForMetric.length > 0) {
          const avg = valuesForMetric.reduce((sum, v) => sum + v, 0) / valuesForMetric.length;
          dataPoint[`${metric}_daily_avg`] = Number(avg.toFixed(1));
        }
      });
      
      return dataPoint;
    });

    if (chartData.length === 0) {
      const today = new Date().toLocaleDateString('fr-FR');
      const yesterday = new Date(Date.now() - 24*60*60*1000).toLocaleDateString('fr-FR');
      chartData.push({ date: yesterday }, { date: today });
    }

    const filteredAverages = {};
    selectedMetrics.forEach(metric => {
      const allValues = [];
      
      playersToAnalyze.forEach(player => {
        const responses = player.responses || [];
        let filteredResponses = responses;
        
        if (!selectedQuestionTypes.includes('all')) {
          filteredResponses = responses.filter(r => selectedQuestionTypes.includes(r.type));
        }
        
        filteredResponses.forEach(response => {
          const responseDate = new Date(response.created_at);
          
          if (startDate && new Date(startDate) > responseDate) return;
          if (endDate && new Date(endDate) < responseDate) return;
          
          if (response.data?.[metric] != null && !isNaN(response.data[metric])) {
            allValues.push(Number(response.data[metric]));
          }
        });
      });
      
      if (allValues.length > 0) {
        filteredAverages[metric] = Number((allValues.reduce((sum, v) => sum + v, 0) / allValues.length).toFixed(1));
      }
    });

    const globalAverages = {};
    const allPlayersCount = players.length;
    const selectedCount = selectedPlayers.length;
    
    if (selectedCount === 0 || selectedCount === allPlayersCount) {
      selectedMetrics.forEach(metric => {
        globalAverages[metric] = filteredAverages[metric];
      });
    } else {
      selectedMetrics.forEach(metric => {
        const allValues = [];
        
        players.forEach(player => {
          const responses = player.responses || [];
          let filteredResponses = responses;
          
          if (!selectedQuestionTypes.includes('all')) {
            filteredResponses = responses.filter(r => selectedQuestionTypes.includes(r.type));
          }
          
          filteredResponses.forEach(response => {
            const responseDate = new Date(response.created_at);
            
            if (startDate && new Date(startDate) > responseDate) return;
            if (endDate && new Date(endDate) < responseDate) return;
            
            if (response.data?.[metric] != null && !isNaN(response.data[metric])) {
              allValues.push(Number(response.data[metric]));
            }
          });
        });
        
        if (allValues.length > 0) {
          globalAverages[metric] = Number((allValues.reduce((sum, v) => sum + v, 0) / allValues.length).toFixed(1));
        }
      });
    }

    chartData.forEach(point => {
      selectedMetrics.forEach(metric => {
        if (filteredAverages[metric] != null) {
          point[`${metric}_filtered_avg`] = filteredAverages[metric];
        }
        if (globalAverages[metric] != null) {
          point[`${metric}_global_avg`] = globalAverages[metric];
        }
      });
    });

    return { chartData, globalAverages, filteredAverages };
  };

  const saveObjectifsCollectifs = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('team_settings')
        .upsert({
          key: 'objectifs_collectifs',
          value: objectifsCollectifs,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });
      
      if (error) throw error;
      alert('Objectifs collectifs sauvegardés !');
    } catch (error) {
      console.error('Erreur sauvegarde objectifs collectifs:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
    }
    setLoading(false);
  };

  const saveObjectifsIndividuels = async (playerId, objectifs) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('players')
        .update({ objectifs_individuels: objectifs })
        .eq('id', playerId);
      
      if (error) throw error;
      
      setObjectifsIndividuels(prev => ({
        ...prev,
        [playerId]: objectifs
      }));
      
      alert('Objectifs individuels sauvegardés !');
    } catch (error) {
      console.error('Erreur sauvegarde objectifs individuels:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
    }
    setLoading(false);
  };

  const saveObjectifsMentaux = async (playerId, objectifs) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('players')
        .update({ objectifs_mentaux: objectifs })
        .eq('id', playerId);
      
      if (error) throw error;
      
      setObjectifsMentaux(prev => ({
        ...prev,
        [playerId]: objectifs
      }));
      
      alert('Objectifs mentaux sauvegardés !');
    } catch (error) {
      console.error('Erreur sauvegarde objectifs mentaux:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
    }
    setLoading(false);
  };

  const exportData = async () => {
    try {
      const { data: responses } = await supabase
        .from('responses')
        .select(`
          *,
          players (name)
        `)
        .order('created_at', { ascending: false });

      const csvContent = [
        ['Date', 'Joueuse', 'Type', 'Motivation', 'Fatigue', 'Plaisir', 'RPE', 'Tactique', 'Technique', 'Commentaires'].join(','),
        ...responses.map(r => [
          new Date(r.created_at).toLocaleDateString('fr-FR'),
          `"${r.players?.name || ''}"`,
          r.type,
          r.data?.motivation || '',
          r.data?.fatigue || '',
          r.data?.plaisir || r.data?.plaisir_seance || '',
          r.data?.intensite_rpe || '',
          r.data?.tactique || '',
          r.data?.technique || '',
          `"${r.data?.commentaires_libres || ''}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-futsal-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export');
    }
  };

  const deletePlayer = async (playerId) => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver cette joueuse ?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('players')
        .update({ is_active: false })
        .eq('id', playerId);
      
      if (error) throw error;
      
      alert('Joueuse désactivée avec succès');
      await loadPlayers();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la désactivation');
    }
    setLoading(false);
  };

  const addNewPlayer = async () => {
    const name = prompt('Nom de la nouvelle joueuse :');
    if (!name) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('players')
        .insert({ name: name.trim() });
      
      if (error) throw error;
      
      alert('Joueuse ajoutée !');
      await loadPlayers();
    } catch (error) {
      console.error('Erreur ajout joueur:', error);
      alert('Erreur lors de l\'ajout');
    }
    setLoading(false);
  };

  const { chartData, globalAverages, filteredAverages } = getUnifiedChartData();

  return (
    <div className="min-h-screen p-4" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{color: '#1D2945'}}>Administration</h1>
              <p className="text-gray-600 mt-1">Panneau d'administration - Mode Entraîneur</p>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={addNewPlayer} disabled={loading} className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50" style={{background: 'linear-gradient(135deg, #C09D5A 0%, #d4a574 100%)'}}>
                <UserPlus size={16} />
                <span>Ajouter</span>
              </button>
              <button onClick={exportData} className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all">
                <Download size={16} />
                <span>Export CSV</span>
              </button>
              <button onClick={() => setCurrentView('players')} className="flex items-center space-x-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all">
                <ChevronLeft size={20} />
                <span>Retour</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{color: '#1D2945'}}>
            <Users className="inline mr-2" size={24} />
            Gestion des Joueuses
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {players.map(player => (
              <div 
                key={player.id} 
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 overflow-hidden group relative"
                onClick={() => {
                  setSelectedPlayer(player);
                  setCurrentView('admin-player-detail');
                }}
                style={{
                  background: 'linear-gradient(135deg, #fef9e7 0%, #f0f4f8 100%)',
                  borderColor: '#C09D5A',
                  minHeight: '300px',
                  width: '100%',
                  maxWidth: '300px'
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePlayer(player.id);
                  }}
                  className="absolute top-3 right-3 w-7 h-7 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 hover:scale-110 flex items-center justify-center z-10"
                >
                  <Trash2 size={12} />
                </button>

                <div className="p-6 text-center h-full flex flex-col justify-center">
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden border-2 border-gray-300">
                    {player.photo_url ? (
                      <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold" style={{background: 'linear-gradient(135deg, #1D2945 0%, #C09D5A 100%)'}}>
                        {player.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-lg mb-3" style={{color: '#1D2945'}}>
                    {player.name}
                  </h3>
                  
                  <div className="flex justify-center space-x-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  </div>

                  <div className="text-sm text-gray-700 space-y-1">
                    <p className="font-medium">{playerStats[player.id]?.total_responses || 0} réponses totales</p>
                    <p className="text-xs">
                      Dernière activité: {playerStats[player.id]?.last_response_date || 'Aucune'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{color: '#1D2945'}}>
            <TrendingUp className="inline mr-2" size={24} />
            Statistiques et Analyses
          </h2>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
              <Filter size={20} className="mr-2" />
              Filtres d'Analyse
            </h3>
            
            {/* FILTRE DE PÉRIODE */}
            <div className="mb-6 pb-6 border-b-2 border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar size={20} className="text-purple-600" />
                  <label className="text-sm font-semibold text-gray-700">Période d'analyse</label>
                </div>
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-lg hover:bg-purple-200 transition-all font-medium"
                >
                  Toute la période
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
                  <label className="block text-xs font-semibold text-purple-700 mb-2">Date de début</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
                  <label className="block text-xs font-semibold text-purple-700 mb-2">Date de fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              
              {(startDate || endDate) && (
                <div className="mt-4 p-3 bg-purple-50 border-2 border-purple-300 rounded-lg">
                  <p className="text-sm text-purple-900 font-medium">
                    Période sélectionnée : {startDate ? new Date(startDate).toLocaleDateString('fr-FR') : 'Début'} → {endDate ? new Date(endDate).toLocaleDateString('fr-FR') : 'Fin'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Joueuses</label>
                  <div className="flex space-x-2">
                    <button onClick={() => setSelectedPlayers([])} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-all">Toutes</button>
                    <button onClick={() => setSelectedPlayers(players.map(p => p.id))} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-all">Sélectionner</button>
                    <button onClick={() => setSelectedPlayers([])} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-all">Aucune</button>
                  </div>
                </div>
                
                <div className="relative">
                  <select 
                    multiple
                    size="6"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                    value={selectedPlayers}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setSelectedPlayers(values);
                    }}
                  >
                    {players.map(player => (
                      <option key={player.id} value={player.id} className="py-1 px-2 hover:bg-blue-50">
                        {player.name}
                      </option>
                    ))}
                  </select>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedPlayers.length === 0 ? `Toutes sélectionnées (${players.length})` : `${selectedPlayers.length} sélectionnée(s)`}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Métriques</label>
                  <div className="flex space-x-2">
                    <button onClick={() => setSelectedMetrics(metricsOptions.map(m => m.value))} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-all">Toutes</button>
                    <button onClick={() => setSelectedMetrics([])} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-all">Aucune</button>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    {metricsOptions.map(metric => (
                      <label key={metric.value} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedMetrics.includes(metric.value)}
                          onChange={() => {
                            if (selectedMetrics.includes(metric.value)) {
                              setSelectedMetrics(selectedMetrics.filter(m => m !== metric.value));
                            } else {
                              setSelectedMetrics([...selectedMetrics, metric.value]);
                            }
                          }}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <div className="flex items-center space-x-2 flex-1">
                          <div className="w-4 h-4 rounded" style={{backgroundColor: metric.color}}></div>
                          <span className="text-sm text-gray-700">{metric.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{selectedMetrics.length} métrique(s) sélectionnée(s)</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Types questionnaires</label>
                  <div className="flex space-x-2">
                    <button onClick={() => setSelectedQuestionTypes(['all'])} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded hover:bg-purple-200 transition-all">Tous</button>
                    <button onClick={() => setSelectedQuestionTypes([])} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-all">Aucun</button>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    {questionTypeOptions.map(type => (
                      <label key={type.value} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedQuestionTypes.includes(type.value)}
                          onChange={() => {
                            if (type.value === 'all') {
                              if (selectedQuestionTypes.includes('all')) {
                                setSelectedQuestionTypes([]);
                              } else {
                                setSelectedQuestionTypes(['all']);
                              }
                            } else {
                              const newTypes = selectedQuestionTypes.filter(t => t !== 'all');
                              if (selectedQuestionTypes.includes(type.value)) {
                                setSelectedQuestionTypes(newTypes.filter(t => t !== type.value));
                              } else {
                                setSelectedQuestionTypes([...newTypes, type.value]);
                              }
                            }
                          }}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <div className="flex items-center space-x-2 flex-1">
                          <div className={`w-3 h-3 rounded-full ${
                            type.value === 'all' ? 'bg-gray-500' :
                            type.value === 'pre' ? 'bg-blue-500' :
                            type.value === 'post' ? 'bg-green-500' :
                            type.value === 'match' ? 'bg-purple-500' :
                            'bg-yellow-500'
                          }`}></div>
                          <span className="text-sm text-gray-700">{type.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {selectedQuestionTypes.length === 0 ? 'Aucun sélectionné' : 
                   selectedQuestionTypes.includes('all') ? 'Tous les questionnaires' :
                   `${selectedQuestionTypes.length} type(s) sélectionné(s)`}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                <div className="flex items-center space-x-4 flex-wrap gap-2">
                  <span className="text-gray-600"><strong>Filtres actifs:</strong></span>
                  {(startDate || endDate) && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                      {startDate ? new Date(startDate).toLocaleDateString('fr-FR', {day: '2-digit', month: 'short'}) : '...'} → {endDate ? new Date(endDate).toLocaleDateString('fr-FR', {day: '2-digit', month: 'short'}) : '...'}
                    </span>
                  )}
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {selectedPlayers.length === 0 ? `${players.length} joueuses` : `${selectedPlayers.length} joueuses`}
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    {selectedMetrics.length} métriques
                  </span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                    {selectedQuestionTypes.includes('all') ? 'Tous types' : `${selectedQuestionTypes.length} types`}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedPlayers([]);
                    setSelectedMetrics(['motivation']);
                    setSelectedQuestionTypes(['all']);
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-xs underline"
                >
                  Réinitialiser filtres
                </button>
              </div>
            </div>
          </div>

          {/* Graphique - suite dans le prochain message si nécessaire */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Évolution Temporelle des Métriques Sélectionnées
            </h3>
            
            {selectedMetrics.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 size={48} className="mx-auto mb-4" />
                <p>Sélectionnez au moins une métrique pour afficher le graphique temporel</p>
              </div>
            ) : chartData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aucune donnée disponible pour les filtres sélectionnés</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} angle={-45} textAnchor="end" height={60} />
                    <YAxis domain={[0, 20]} />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length > 0) {
                          return (
                            <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
                              <h4 className="font-semibold mb-2 text-gray-800">{label}</h4>
                              <div className="space-y-1 text-sm">
                                {payload.map((entry, index) => {
                                  const metricKey = entry.dataKey.replace('_daily_avg', '').replace('_filtered_avg', '').replace('_global_avg', '');
                                  const metricInfo = metricsOptions.find(m => m.value === metricKey);
                                  
                                  let lbl = metricInfo?.label || '';
                                  if (entry.dataKey.includes('_daily_avg')) {
                                    lbl += ' (jour)';
                                  } else if (entry.dataKey.includes('_filtered_avg')) {
                                    lbl += ' (moy. sélection)';
                                  } else if (entry.dataKey.includes('_global_avg')) {
                                    lbl += ' (moy. équipe)';
                                  }
                                  
                                  return (
                                    <div key={index} className="flex justify-between items-center gap-3">
                                      <span style={{color: entry.color}}>{lbl}:</span>
                                      <span className="font-medium">{entry.value}/20</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    
                    {selectedMetrics.map(metric => {
                      const metricInfo = metricsOptions.find(m => m.value === metric);
                      return (
                        <Line
                          key={`daily_${metric}`}
                          type="monotone"
                          dataKey={`${metric}_daily_avg`}
                          stroke={metricInfo?.color || '#1D2945'}
                          strokeWidth={3}
                          dot={{ fill: metricInfo?.color, strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, stroke: metricInfo?.color, strokeWidth: 2 }}
                          name={`${metricInfo?.label} (jour)`}
                        />
                      );
                    })}
                    
                    {selectedMetrics.map(metric => {
                      const metricInfo = metricsOptions.find(m => m.value === metric);
                      const filteredAvg = filteredAverages[metric];
                      
                      if (!filteredAvg) return null;
                      
                      return (
                        <Line
                          key={`filtered_${metric}`}
                          type="monotone"
                          dataKey={`${metric}_filtered_avg`}
                          stroke={metricInfo?.color || '#1D2945'}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          activeDot={false}
                          name={`${metricInfo?.label} (moyenne sélection)`}
                        />
                      );
                    })}
                    
                    {(selectedPlayers.length > 0 && selectedPlayers.length < players.length) && selectedMetrics.map(metric => {
                      const metricInfo = metricsOptions.find(m => m.value === metric);
                      const globalAvg = globalAverages[metric];
                      
                      if (!globalAvg) return null;
                      
                      return (
                        <Line
                          key={`global_${metric}`}
                          type="monotone"
                          dataKey={`${metric}_global_avg`}
                          stroke={metricInfo?.color || '#1D2945'}
                          strokeWidth={2.5}
                          strokeDasharray="15 5"
                          dot={false}
                          activeDot={false}
                          name={`${metricInfo?.label} (moyenne équipe)`}
                          opacity={0.7}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>

                <div className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-gray-700">Moyennes quotidiennes (lignes pleines épaisses)</h4>
                      <div className="space-y-2">
                        {selectedMetrics.map(metric => {
                          const metricInfo = metricsOptions.find(m => m.value === metric);
                          return (
                            <div key={metric} className="flex items-center space-x-2 text-sm">
                              <div className="w-6 h-1 rounded" style={{backgroundColor: metricInfo?.color}}></div>
                              <span>{metricInfo?.label}</span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 italic">Moyenne du jour pour les joueuses ayant répondu</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-gray-700">
                        Moyennes période {selectedPlayers.length > 0 && selectedPlayers.length < players.length ? '(sélection)' : '(toutes)'} - pointillés courts
                      </h4>
                      <div className="space-y-2">
                        {selectedMetrics.map(metric => {
                          const metricInfo = metricsOptions.find(m => m.value === metric);
                          const filteredAvg = filteredAverages[metric];
                          return (
                            <div key={metric} className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-1 rounded" style={{borderTop: `2px dashed ${metricInfo?.color}`, borderSpacing: '5px'}}></div>
                                <span>{metricInfo?.label}:</span>
                              </div>
                              <span className="font-semibold text-gray-700">{filteredAvg || 'N/A'}/20</span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 italic">
                        Moyenne sur toute la période des joueuses {selectedPlayers.length > 0 && selectedPlayers.length < players.length ? 'sélectionnées' : ''}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-gray-700">
                        Moyennes globales équipe {selectedPlayers.length > 0 && selectedPlayers.length < players.length ? '- tirets longs' : ''}
                      </h4>
                      <div className="space-y-2">
                        {selectedMetrics.map(metric => {
                          const metricInfo = metricsOptions.find(m => m.value === metric);
                          const globalAvg = globalAverages[metric];
                          return (
                            <div key={metric} className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                {selectedPlayers.length > 0 && selectedPlayers.length < players.length ? (
                                  <div className="w-6 h-1 rounded" style={{borderTop: `2.5px dashed ${metricInfo?.color}`, borderSpacing: '15px'}}></div>
                                ) : (
                                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: metricInfo?.color}}></div>
                                )}
                                <span>{metricInfo?.label}:</span>
                              </div>
                              <span className="font-bold text-gray-800">{globalAvg || 'N/A'}/20</span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 italic">
                        {selectedPlayers.length > 0 && selectedPlayers.length < players.length 
                          ? `Moyenne des ${players.length} joueuses de l'équipe (référence)` 
                          : 'Même valeur que moyennes période (toutes sélectionnées)'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Lecture du graphique:</strong> 
                      {selectedPlayers.length > 0 && selectedPlayers.length < players.length ? (
                        <span> Les lignes pleines épaisses montrent les performances quotidiennes. Les pointillés courts représentent la moyenne période des {selectedPlayers.length} joueuse(s) sélectionnée(s). Les tirets longs montrent la moyenne de TOUTE l'équipe ({players.length} joueuses) pour comparaison.</span>
                      ) : (
                        <span> Les lignes pleines épaisses montrent les performances quotidiennes. Les pointillés courts représentent la moyenne sur toute la période. Quand toutes les joueuses sont sélectionnées, les moyennes période et globales sont identiques.</span>
                      )}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600">{selectedPlayers.length > 0 ? selectedPlayers.length : players.length}</div>
              <div className="text-sm text-gray-600">Joueuses analysées</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">{selectedMetrics.length}</div>
              <div className="text-sm text-gray-600">Métriques suivies</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-600">{selectedQuestionTypes.length}</div>
              <div className="text-sm text-gray-600">Types de questionnaire</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-yellow-600">{Object.values(playerStats).reduce((sum, stat) => sum + (stat.total_responses || 0), 0)}</div>
              <div className="text-sm text-gray-600">Réponses totales</div>
            </div>
          </div>
        </div>

        {/* Section Blessures */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-red-600 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Suivi des Blessures
          </h2>

          {(() => {
            const playersToAnalyze = selectedPlayers.length > 0 
              ? players.filter(p => selectedPlayers.includes(p.id))
              : players;

            const injuryData = [];
            const injuryByZone = {};
            let totalInjuries = 0;
            let activeInjuries = 0;

            playersToAnalyze.forEach(player => {
              const responses = player.responses || [];
              const injuryResponses = responses.filter(r => {
                const responseDate = new Date(r.created_at);
                if (startDate && new Date(startDate) > responseDate) return false;
                if (endDate && new Date(endDate) < responseDate) return false;
                return r.type === 'injury' || r.data?.blessure_actuelle === 'oui';
              });

              injuryResponses.forEach(response => {
                const date = new Date(response.created_at).toLocaleDateString('fr-FR');
                const zone = response.data?.zone_blessure || 'Non spécifiée';
                const douleur = response.data?.douleur_niveau || 0;
                
                totalInjuries++;
                
                if (response.data?.blessure_actuelle === 'oui') {
                  activeInjuries++;
                }

                injuryData.push({
                  date,
                  player: player.name,
                  zone,
                  douleur: Number(douleur),
                  status: response.data?.blessure_actuelle
                });

                injuryByZone[zone] = (injuryByZone[zone] || 0) + 1;
              });
            });

            const injuryTimeline = injuryData.reduce((acc, injury) => {
              const existing = acc.find(item => item.date === injury.date);
              if (existing) {
                existing.count++;
                existing.avgDouleur = ((existing.avgDouleur * (existing.count - 1)) + injury.douleur) / existing.count;
              } else {
                acc.push({
                  date: injury.date,
                  count: 1,
                  avgDouleur: injury.douleur
                });
              }
              return acc;
            }, []);

            injuryTimeline.sort((a, b) => {
              const dateA = new Date(a.date.split('/').reverse().join('-'));
              const dateB = new Date(b.date.split('/').reverse().join('-'));
              return dateA - dateB;
            });

            const zonesSorted = Object.entries(injuryByZone)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5);

            return totalInjuries === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium">Aucune blessure signalée</p>
                <p className="text-sm mt-2">C'est une excellente nouvelle pour l'équipe</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-red-600 font-medium">Blessures totales</p>
                        <p className="text-3xl font-bold text-red-700 mt-1">{totalInjuries}</p>
                      </div>
                      <svg className="w-12 h-12 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-600 font-medium">Blessures actives</p>
                        <p className="text-3xl font-bold text-orange-700 mt-1">{activeInjuries}</p>
                      </div>
                      <svg className="w-12 h-12 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Joueuses affectées</p>
                        <p className="text-3xl font-bold text-green-700 mt-1">
                          {[...new Set(injuryData.map(i => i.player))].length}
                        </p>
                      </div>
                      <svg className="w-12 h-12 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Évolution temporelle des blessures</h3>
                    {injuryTimeline.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={injuryTimeline}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{fontSize: 11}} angle={-45} textAnchor="end" height={70} />
                          <YAxis />
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length > 0) {
                                return (
                                  <div className="bg-white p-3 border-2 border-red-300 rounded-lg shadow-lg">
                                    <p className="font-semibold text-gray-800 mb-2">{label}</p>
                                    <p className="text-sm text-red-600">
                                      <strong>Blessures signalées:</strong> {payload[0].value}
                                    </p>
                                    {payload[1] && (
                                      <p className="text-sm text-orange-600">
                                        <strong>Douleur moyenne:</strong> {payload[1].value.toFixed(1)}/10
                                      </p>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#dc2626" 
                            strokeWidth={3}
                            dot={{ fill: '#dc2626', strokeWidth: 2, r: 5 }}
                            name="Nombre de blessures"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="avgDouleur" 
                            stroke="#f59e0b" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                            name="Douleur moyenne"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Aucune donnée temporelle</p>
                    )}
                    <div className="mt-3 flex items-center space-x-6 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-1 bg-red-600 rounded"></div>
                        <span className="text-gray-600">Nombre de blessures</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-1 bg-orange-500 rounded" style={{borderTop: '2px dashed #f59e0b'}}></div>
                        <span className="text-gray-600">Douleur moyenne (/10)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Zones les plus touchées</h3>
                    {zonesSorted.length > 0 ? (
                      <div className="space-y-3">
                        {zonesSorted.map(([zone, count], index) => {
                          const percentage = (count / totalInjuries) * 100;
                          return (
                            <div key={zone} className="relative">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">{zone}</span>
                                <span className="text-sm font-semibold text-red-600">{count} ({percentage.toFixed(0)}%)</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${percentage}%`,
                                    background: index === 0 ? 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)' :
                                               index === 1 ? 'linear-gradient(90deg, #ea580c 0%, #f97316 100%)' :
                                               index === 2 ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)' :
                                               'linear-gradient(90deg, #84cc16 0%, #a3e635 100%)'
                                  }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Aucune zone identifiée</p>
                    )}
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <div className="flex">
                    <svg className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">Recommandations</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        {activeInjuries > 0 && `${activeInjuries} joueuse(s) actuellement blessée(s). `}
                        Assurez-vous d'un suivi médical approprié et adaptez les entraînements en conséquence. 
                        Encouragez les joueuses à signaler rapidement toute douleur ou gêne.
                      </p>
                    </div>
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 py-2">
                    Voir le détail des blessures récentes ({injuryData.slice(0, 10).length} dernières)
                  </summary>
                  <div className="mt-3 space-y-2">
                    {injuryData.slice(-10).reverse().map((injury, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{injury.player}</p>
                          <p className="text-xs text-gray-600">{injury.zone} - Douleur: {injury.douleur}/10</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{injury.date}</p>
                          {injury.status === 'oui' && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Active</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </>
            );
          })()}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{color: '#1D2945'}}>
              <BarChart3 className="inline mr-2" size={24} />
              Gestion des Objectifs
            </h2>
            <button onClick={() => setEditingObjectives(!editingObjectives)} className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all">
              <Edit3 size={16} />
              <span>{editingObjectives ? 'Terminer' : 'Modifier'}</span>
            </button>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Objectifs Collectifs de l'Équipe</h3>
            {editingObjectives ? (
              <div className="space-y-3">
                <textarea value={objectifsCollectifs} onChange={(e) => setObjectifsCollectifs(e.target.value)} placeholder="Entrez les objectifs collectifs de l'équipe..." className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={4} />
                <button onClick={saveObjectifsCollectifs} disabled={loading} className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all disabled:opacity-50">
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{objectifsCollectifs || 'Aucun objectif collectif défini.'}</p>
              </div>
            )}
          </div>

          {editingObjectives && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Objectifs Individuels</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {players.map(player => (
                  <div key={player.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                        {player.photo_url ? (
                          <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold" style={{background: 'linear-gradient(135deg, #1D2945 0%, #C09D5A 100%)'}}>
                            {player.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900">{player.name}</h4>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-blue-700 mb-2">Objectifs Techniques</label>
                      <textarea value={objectifsIndividuels[player.id] || ''} onChange={(e) => setObjectifsIndividuels(prev => ({...prev, [player.id]: e.target.value}))} placeholder="Objectifs techniques..." className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500" rows={3} />
                      <button onClick={() => saveObjectifsIndividuels(player.id, objectifsIndividuels[player.id] || '')} disabled={loading} className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:opacity-50">Sauvegarder</button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">Objectifs Mentaux</label>
                      <textarea value={objectifsMentaux[player.id] || ''} onChange={(e) => setObjectifsMentaux(prev => ({...prev, [player.id]: e.target.value}))} placeholder="Objectifs mentaux..." className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500" rows={3} />
                      <button onClick={() => saveObjectifsMentaux(player.id, objectifsMentaux[player.id] || '')} disabled={loading} className="mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors disabled:opacity-50">Sauvegarder</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
