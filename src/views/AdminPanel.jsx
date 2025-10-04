// views/AdminPanel.jsx - Avec section cycle menstruel
import React, { useState } from 'react';
import { ChevronLeft, Edit3, UserPlus, Download, Trash2, Filter, TrendingUp, BarChart3, Users, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
  
  // Filtres spécifiques pour les blessures
  const [injurySelectedPlayers, setInjurySelectedPlayers] = useState([]);
  const [injuryStartDate, setInjuryStartDate] = useState('');
  const [injuryEndDate, setInjuryEndDate] = useState('');

  // Filtres pour le cycle menstruel
  const [menstrualSelectedPlayers, setMenstrualSelectedPlayers] = useState([]);
  const [menstrualStartDate, setMenstrualStartDate] = useState('');
  const [menstrualEndDate, setMenstrualEndDate] = useState('');

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
        ['Date', 'Joueuse', 'Type', 'Motivation', 'Fatigue', 'Plaisir', 'RPE', 'Tactique', 'Technique', 'Cycle Phase', 'Cycle Impact', 'Commentaires'].join(','),
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
          r.data?.cycle_phase || '',
          r.data?.cycle_impact || '',
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

        {/* NOUVELLE SECTION : Suivi du Cycle Menstruel */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-pink-600 flex items-center">
            🌸 Suivi du Cycle Menstruel
          </h2>

          {/* Filtres pour le cycle menstruel */}
          <div className="bg-pink-50 rounded-lg p-4 mb-6 border-2 border-pink-200">
            <h3 className="text-sm font-semibold mb-3 text-pink-800 flex items-center">
              <Filter size={16} className="mr-2" />
              Filtres d'analyse
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-pink-700">Joueuses</label>
                  <button
                    onClick={() => setMenstrualSelectedPlayers([])}
                    className="px-2 py-0.5 bg-pink-100 text-pink-700 text-xs rounded hover:bg-pink-200"
                  >
                    Toutes
                  </button>
                </div>
                <select 
                  multiple
                  size="4"
                  className="w-full p-2 border-2 border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 bg-white text-sm"
                  value={menstrualSelectedPlayers}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setMenstrualSelectedPlayers(values);
                  }}
                >
                  {players.map(player => (
                    <option key={player.id} value={player.id} className="py-1 px-2 hover:bg-pink-50">
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-pink-700">Période</label>
                  <button
                    onClick={() => {
                      setMenstrualStartDate('');
                      setMenstrualEndDate('');
                    }}
                    className="px-2 py-0.5 bg-pink-100 text-pink-700 text-xs rounded hover:bg-pink-200"
                  >
                    Réinitialiser
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={menstrualStartDate}
                    onChange={(e) => setMenstrualStartDate(e.target.value)}
                    className="w-full px-2 py-1 border-2 border-pink-200 rounded text-sm focus:ring-2 focus:ring-pink-500"
                  />
                  <input
                    type="date"
                    value={menstrualEndDate}
                    onChange={(e) => setMenstrualEndDate(e.target.value)}
                    min={menstrualStartDate}
                    className="w-full px-2 py-1 border-2 border-pink-200 rounded text-sm focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {(() => {
            const playersToAnalyze = menstrualSelectedPlayers.length > 0 
              ? players.filter(p => menstrualSelectedPlayers.includes(p.id))
              : players;

            const menstrualData = [];
            const phaseCount = {
              'menstruations': 0,
              'folliculaire': 0,
              'ovulation': 0,
              'luteale': 0,
              'contraception': 0
            };
            let totalResponses = 0;
            let responsesWithCycle = 0;
            const impactValues = [];

            playersToAnalyze.forEach(player => {
              const responses = player.responses || [];
              const preResponses = responses.filter(r => {
                if (r.type !== 'pre') return false;
                
                const responseDate = new Date(r.created_at);
                if (menstrualStartDate && new Date(menstrualStartDate) > responseDate) return false;
                if (menstrualEndDate && new Date(menstrualEndDate) < responseDate) return false;
                
                return true;
              });

              preResponses.forEach(response => {
                totalResponses++;
                
                if (response.data?.cycle_phase && response.data.cycle_phase !== '') {
                  responsesWithCycle++;
                  const phase = response.data.cycle_phase;
                  phaseCount[phase] = (phaseCount[phase] || 0) + 1;
                  
                  if (response.data.cycle_impact != null) {
                    impactValues.push(Number(response.data.cycle_impact));
                  }

                  menstrualData.push({
                    date: new Date(response.created_at).toLocaleDateString('fr-FR'),
                    player: player.name,
                    phase: phase,
                    impact: response.data.cycle_impact || 10
                  });
                }
              });
            });

            const avgImpact = impactValues.length > 0 
              ? (impactValues.reduce((sum, v) => sum + v, 0) / impactValues.length).toFixed(1)
              : 0;

            const phaseLabels = {
              'menstruations': 'Menstruations',
              'folliculaire': 'Phase folliculaire',
              'ovulation': 'Ovulation',
              'luteale': 'Phase lutéale',
              'contraception': 'Contraception'
            };

            const phaseColors = {
              'menstruations': '#dc2626',
              'folliculaire': '#f59e0b',
              'ovulation': '#10b981',
              'luteale': '#8b5cf6',
              'contraception': '#6366f1'
            };

            const pieData = Object.entries(phaseCount)
              .filter(([_, count]) => count > 0)
              .map(([phase, count]) => ({
                name: phaseLabels[phase],
                value: count,
                color: phaseColors[phase]
              }));

            return totalResponses === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium">Aucune donnée disponible</p>
                <p className="text-sm mt-2">Les joueuses n'ont pas encore rempli cette section</p>
              </div>
            ) : responsesWithCycle === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium">Aucune donnée de cycle menstruel</p>
                <p className="text-sm mt-2">
                  {totalResponses} questionnaires pré-séance complétés, mais aucune joueuse n'a renseigné son cycle
                </p>
                <p className="text-xs mt-4 text-pink-600">
                  Cette section est optionnelle et confidentielle
                </p>
              </div>
            ) : (
              <>
                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-pink-50 border-2 border-pink-200 rounded-lg">
                    <p className="text-sm text-pink-600 font-medium">Réponses totales</p>
                    <p className="text-3xl font-bold text-pink-700 mt-1">{totalResponses}</p>
                  </div>

                  <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Avec info cycle</p>
                    <p className="text-3xl font-bold text-purple-700 mt-1">{responsesWithCycle}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {((responsesWithCycle / totalResponses) * 100).toFixed(0)}% de taux de réponse
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Impact moyen</p>
                    <p className="text-3xl font-bold text-blue-700 mt-1">{avgImpact}/20</p>
                    <p className="text-xs text-gray-600 mt-1">10 = neutre</p>
                  </div>

                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Joueuses</p>
                    <p className="text-3xl font-bold text-green-700 mt-1">
                      {[...new Set(menstrualData.map(d => d.player))].length}
                    </p>
                  </div>
                </div>

                {/* Graphiques */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Distribution des phases */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Distribution des phases</h3>
                    {pieData.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 space-y-2">
                          {pieData.map(entry => (
                            <div key={entry.name} className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 rounded" style={{backgroundColor: entry.color}}></div>
                                <span>{entry.name}</span>
                              </div>
                              <span className="font-semibold">{entry.value} ({((entry.value / responsesWithCycle) * 100).toFixed(0)}%)</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Aucune donnée</p>
                    )}
                  </div>

                  {/* Impact par phase */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Impact moyen par phase</h3>
                    {(() => {
                      const impactByPhase = {};
                      menstrualData.forEach(d => {
                        if (!impactByPhase[d.phase]) {
                          impactByPhase[d.phase] = [];
                        }
                        impactByPhase[d.phase].push(d.impact);
                      });

                      const barData = Object.entries(impactByPhase).map(([phase, impacts]) => ({
                        phase: phaseLabels[phase],
                        impact: (impacts.reduce((sum, v) => sum + v, 0) / impacts.length).toFixed(1),
                        color: phaseColors[phase]
                      }));

                      return barData.length > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={barData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="phase" tick={{fontSize: 11}} angle={-20} textAnchor="end" height={80} />
                              <YAxis domain={[0, 20]} />
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length > 0) {
                                    return (
                                      <div className="bg-white p-3 border-2 border-pink-300 rounded-lg shadow-lg">
                                        <p className="font-semibold text-gray-800">{payload[0].payload.phase}</p>
                                        <p className="text-sm text-pink-600">
                                          Impact moyen: {payload[0].value}/20
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">10 = neutre</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="impact" fill="#ec4899">
                                {barData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                          <div className="mt-3 p-3 bg-pink-50 rounded border border-pink-200">
                            <p className="text-xs text-pink-800">
                              <strong>Lecture:</strong> Plus la valeur est basse, plus l'impact négatif est fort. 
                              10 = impact neutre. Valeur élevée = impact positif perçu.
                            </p>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-500 text-center py-8">Pas assez de données</p>
                      );
                    })()}
                  </div>
                </div>

                {/* Informations importantes */}
                <div className="bg-pink-50 border-l-4 border-pink-500 p-4">
                  <h3 className="text-sm font-bold text-pink-800 mb-2">Informations importantes</h3>
                  <ul className="text-xs text-pink-700 space-y-1">
                    <li>• Ces données sont <strong>optionnelles et confidentielles</strong></li>
                    <li>• Elles permettent d'adapter l'entraînement à la physiologie de chaque joueuse</li>
                    <li>• Consultez un professionnel de santé pour toute question médicale</li>
                    <li>• Respectez la vie privée des joueuses - ne partagez pas ces données</li>
                    <li>• Taux de réponse: {((responsesWithCycle / totalResponses) * 100).toFixed(0)}% - encouragez les joueuses à partager si elles le souhaitent</li>
                  </ul>
                </div>

                {/* Détails récents */}
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 py-2">
                    Voir les entrées récentes ({menstrualData.slice(0, 15).length} dernières)
                  </summary>
                  <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
                    {menstrualData.slice(-15).reverse().map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{entry.player}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="w-3 h-3 rounded" style={{backgroundColor: phaseColors[entry.phase]}}></div>
                            <p className="text-xs text-gray-600">{phaseLabels[entry.phase]}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{entry.date}</p>
                          <p className="text-sm font-semibold text-pink-600 mt-1">Impact: {entry.impact}/20</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </>
            );
          })()}
        </div>

        {/* Reste du code AdminPanel inchangé... */}
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

        {/* Suite du code existant... les autres sections restent identiques */}
        {/* Je ne les répète pas ici car le fichier est déjà très long */}
        {/* Mais elles doivent rester dans le code complet */}
        
      </div>
    </div>
  );
};

export default AdminPanel;
