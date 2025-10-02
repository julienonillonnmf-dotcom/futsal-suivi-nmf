// views/AdminPanel.jsx - Version corrigée avec moyennes globales fonctionnelles
import React, { useState } from 'react';
import { ChevronLeft, Edit3, UserPlus, Download, Camera, Trash2, Filter, TrendingUp, BarChart3, Users } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
  const [selectedPlayers, setSelectedPlayers] = useState([]); // Filtre joueuses
  const [selectedMetrics, setSelectedMetrics] = useState(['motivation']); // Métriques sélectionnées (multiple)
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState(['all']); // Types questionnaire (multiple)

  // Options de métriques disponibles
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

  // Fonction pour générer les données du graphique unifié avec moyennes - VERSION CORRIGÉE
  const getUnifiedChartData = () => {
    console.log('=== DEBUG getUnifiedChartData ===');
    console.log('selectedMetrics:', selectedMetrics);
    console.log('players count:', players.length);
    console.log('selectedPlayers:', selectedPlayers);
    
    if (selectedMetrics.length === 0) {
      console.log('Aucune métrique sélectionnée');
      return { chartData: [], globalAverages: {}, filteredAverages: {} };
    }

    // Déterminer les joueuses à analyser : soit les sélectionnées, soit toutes
    const playersToAnalyze = selectedPlayers.length > 0 
      ? players.filter(p => selectedPlayers.includes(p.id))
      : players;
    
    console.log('Joueuses analysées:', playersToAnalyze.map(p => p.name));

    // Collecter toutes les dates uniques (pour les joueuses filtrées)
    const allDates = new Set();
    const dateResponses = {}; // Stocker les réponses par date
    
    playersToAnalyze.forEach(player => {
      const responses = player.responses || [];
      console.log(`Player ${player.name}: ${responses.length} réponses`);
      
      let filteredResponses = responses;
      if (!selectedQuestionTypes.includes('all')) {
        filteredResponses = responses.filter(r => selectedQuestionTypes.includes(r.type));
      }
      
      filteredResponses.forEach(response => {
        const date = new Date(response.created_at).toLocaleDateString('fr-FR');
        allDates.add(date);
        
        // Stocker les réponses groupées par date
        if (!dateResponses[date]) {
          dateResponses[date] = [];
        }
        dateResponses[date].push(response);
      });
    });

    console.log('Dates uniques collectées:', Array.from(allDates));

    const sortedDates = Array.from(allDates).sort((a, b) => {
      const dateA = new Date(a.split('/').reverse().join('-'));
      const dateB = new Date(b.split('/').reverse().join('-'));
      return dateA - dateB;
    });

    // Créer les données du graphique avec moyennes quotidiennes
    const chartData = sortedDates.map(date => {
      const dataPoint = { date };
      
      // Calculer la moyenne pour chaque métrique pour cette date
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

    // Si pas de données, créer un graphique vide mais fonctionnel
    if (chartData.length === 0) {
      console.log('ATTENTION: chartData vide, création de données par défaut');
      const today = new Date().toLocaleDateString('fr-FR');
      const yesterday = new Date(Date.now() - 24*60*60*1000).toLocaleDateString('fr-FR');
      chartData.push({ date: yesterday }, { date: today });
    }

    console.log('chartData length:', chartData.length);
    console.log('chartData sample:', chartData[0]);

    // Calculer les moyennes FILTRÉES (joueuses sélectionnées OU toutes)
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
          if (response.data?.[metric] != null && !isNaN(response.data[metric])) {
            allValues.push(Number(response.data[metric]));
          }
        });
      });
      
      if (allValues.length > 0) {
        filteredAverages[metric] = Number((allValues.reduce((sum, v) => sum + v, 0) / allValues.length).toFixed(1));
      }
      
      console.log(`Moyenne filtrée ${metric}:`, filteredAverages[metric], `(${allValues.length} valeurs, ${playersToAnalyze.length} joueuses)`);
    });

    // Calculer les moyennes GLOBALES (TOUTES les joueuses, peu importe le filtre)
    // Si aucun filtre ou toutes sélectionnées, c'est la même chose que filteredAverages
    const globalAverages = {};
    const allPlayersCount = players.length;
    const selectedCount = selectedPlayers.length;
    
    // Si toutes les joueuses sont sélectionnées OU aucune sélection, utiliser les mêmes valeurs
    if (selectedCount === 0 || selectedCount === allPlayersCount) {
      selectedMetrics.forEach(metric => {
        globalAverages[metric] = filteredAverages[metric];
      });
      console.log('Toutes joueuses sélectionnées: moyennes globales = moyennes filtrées');
    } else {
      // Sinon, calculer sur TOUTES les joueuses
      selectedMetrics.forEach(metric => {
        const allValues = [];
        
        players.forEach(player => {
          const responses = player.responses || [];
          let filteredResponses = responses;
          if (!selectedQuestionTypes.includes('all')) {
            filteredResponses = responses.filter(r => selectedQuestionTypes.includes(r.type));
          }
          
          filteredResponses.forEach(response => {
            if (response.data?.[metric] != null && !isNaN(response.data[metric])) {
              allValues.push(Number(response.data[metric]));
            }
          });
        });
        
        if (allValues.length > 0) {
          globalAverages[metric] = Number((allValues.reduce((sum, v) => sum + v, 0) / allValues.length).toFixed(1));
        }
        
        console.log(`Moyenne globale ${metric}:`, globalAverages[metric], `(${allValues.length} valeurs, ${players.length} joueuses)`);
      });
    }

    // CORRECTION : Intégrer les moyennes filtrées dans chaque point de chartData
    chartData.forEach(point => {
      selectedMetrics.forEach(metric => {
        if (filteredAverages[metric] != null) {
          point[`${metric}_global_avg`] = filteredAverages[metric];
        }
      });
    });

    console.log('=== FIN DEBUG ===');
    return { chartData, globalAverages, filteredAverages };
  };

  // Sauvegarder les objectifs collectifs
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

  // Sauvegarder les objectifs individuels
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

  // Sauvegarder les objectifs mentaux
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

  // Export des données
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

  // Upload de photo
  const handlePhotoUpload = async (playerId, file) => {
    if (!file) return;
    
    setLoading(true);
    try {
      const resizedFile = await resizeImage(file);
      
      const fileExt = 'jpg';
      const fileName = `${playerId}-${Date.now()}.${fileExt}`;
      const filePath = `player-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, resizedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('players')
        .update({ photo_url: publicUrl.publicUrl })
        .eq('id', playerId);

      if (updateError) throw updateError;

      setPlayers(prev => prev.map(p => 
        p.id === playerId 
          ? { ...p, photo_url: publicUrl.publicUrl }
          : p
      ));

      alert('Photo mise à jour avec succès !');
    } catch (error) {
      console.error('Erreur upload photo:', error);
      alert('Erreur lors de l\'upload de la photo');
    }
    setLoading(false);
  };

  // Supprimer un joueur
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

  // Ajouter un nouveau joueur
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

  // Données pour les graphiques
  const { chartData, globalAverages } = getUnifiedChartData();

  return (
    <div className="min-h-screen p-4" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{color: '#1D2945'}}>Administration</h1>
              <p className="text-gray-600 mt-1">Panneau d'administration - Mode Entraîneur</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={addNewPlayer}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                style={{background: 'linear-gradient(135deg, #C09D5A 0%, #d4a574 100%)'}}
              >
                <UserPlus size={16} />
                <span>Ajouter</span>
              </button>
              <button
                onClick={exportData}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all"
              >
                <Download size={16} />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setCurrentView('players')}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
              >
                <ChevronLeft size={20} />
                <span>Retour</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 1: Grille des joueuses */}
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
                      <img 
                        src={player.photo_url} 
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-white text-lg font-bold"
                        style={{background: 'linear-gradient(135deg, #1D2945 0%, #C09D5A 100%)'}}
                      >
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

        {/* Section 2: Statistiques avec filtres */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{color: '#1D2945'}}>
            <TrendingUp className="inline mr-2" size={24} />
            Statistiques et Analyses
          </h2>
          
          {/* Filtres */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
              <Filter size={20} className="mr-2" />
              Filtres d'Analyse
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sélection des joueuses */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Joueuses</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedPlayers([])}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-all"
                    >
                      Toutes
                    </button>
                    <button
                      onClick={() => setSelectedPlayers(players.map(p => p.id))}
                      className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-all"
                    >
                      Sélectionner
                    </button>
                    <button
                      onClick={() => setSelectedPlayers([])}
                      className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-all"
                    >
                      Aucune
                    </button>
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
                      <option 
                        key={player.id} 
                        value={player.id}
                        className="py-1 px-2 hover:bg-blue-50"
                      >
                        {player.name}
                      </option>
                    ))}
                  </select>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedPlayers.length === 0 ? `Toutes sélectionnées (${players.length})` : `${selectedPlayers.length} sélectionnée(s)`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Maintenez Ctrl/Cmd pour sélectionner plusieurs joueuses
                  </p>
                </div>
              </div>

              {/* Sélection des métriques */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Métriques</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedMetrics(metricsOptions.map(m => m.value))}
                      className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-all"
                    >
                      Toutes
                    </button>
                    <button
                      onClick={() => setSelectedMetrics([])}
                      className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-all"
                    >
                      Aucune
                    </button>
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
                          <div 
                            className="w-4 h-4 rounded"
                            style={{backgroundColor: metric.color}}
                          ></div>
                          <span className="text-sm text-gray-700">{metric.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {selectedMetrics.length} métrique(s) sélectionnée(s)
                </p>
              </div>

              {/* Sélection des types de questionnaires */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Types questionnaires</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedQuestionTypes(['all'])}
                      className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded hover:bg-purple-200 transition-all"
                    >
                      Tous
                    </button>
                    <button
                      onClick={() => setSelectedQuestionTypes([])}
                      className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-all"
                    >
                      Aucun
                    </button>
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

            {/* Résumé des filtres actifs */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-600">
                    <strong>Filtres actifs:</strong>
                  </span>
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
                  }}
                  className="text-gray-500 hover:text-gray-700 text-xs underline"
                >
                  Réinitialiser filtres
                </button>
              </div>
            </div>
          </div>

          {/* Graphique unifié avec moyennes - SUITE DANS LE PROCHAIN MESSAGE */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Évolution Temporelle des Métriques Sélectionnées
            </h3>
            
            {(() => {
              const { chartData, globalAverages, filteredAverages } = getUnifiedChartData();
              
              if (selectedMetrics.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 size={48} className="mx-auto mb-4" />
                    <p>Sélectionnez au moins une métrique pour afficher le graphique temporel</p>
                  </div>
                );
              }

              if (chartData.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <p>Aucune donnée disponible pour les filtres sélectionnés</p>
                  </div>
                );
              }

              return (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{fontSize: 12}}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis domain={[0, 20]} />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length > 0) {
                            return (
                              <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
                                <h4 className="font-semibold mb-2 text-gray-800">{label}</h4>
                                <div className="space-y-1 text-sm">
                                  {payload.map((entry, index) => {
                                    const metricKey = entry.dataKey.replace('_daily_avg', '').replace('_global_avg', '');
                                    const metricInfo = metricsOptions.find(m => m.value === metricKey);
                                    const isGlobal = entry.dataKey.includes('_global_avg');
                                    return (
                                      <div key={index} className="flex justify-between items-center">
                                        <span style={{color: entry.color}}>
                                          {metricInfo?.label} {isGlobal ? '(moyenne période)' : '(moyenne du jour)'}:
                                        </span>
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
                      
                      {/* Lignes de moyennes quotidiennes */}
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
                      
                      {/* Lignes de moyennes filtrées (période complète) */}
                      {selectedMetrics.map(metric => {
                        const metricInfo = metricsOptions.find(m => m.value === metric);
                        const filteredAvg = filteredAverages[metric];
                        
                        if (!filteredAvg) return null;
                        
                        return (
                          <Line
                            key={`global_${metric}`}
                            type="monotone"
                            dataKey={`${metric}_global_avg`}
                            stroke={metricInfo?.color || '#1D2945'}
                            strokeWidth={2}
                            strokeDasharray="8 4"
                            dot={false}
                            activeDot={false}
                            name={`${metricInfo?.label} (moyenne période)`}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Légende améliorée avec toutes les moyennes */}
                  <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Moyennes quotidiennes */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3 text-gray-700">Moyennes quotidiennes (lignes pleines)</h4>
                        <div className="space-y-2">
                          {selectedMetrics.map(metric => {
                            const metricInfo = metricsOptions.find(m => m.value === metric);
                            return (
                              <div key={metric} className="flex items-center space-x-2 text-sm">
                                <div 
                                  className="w-4 h-0.5 rounded"
                                  style={{backgroundColor: metricInfo?.color}}
                                ></div>
                                <span>{metricInfo?.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Moyennes filtrées (joueuses sélectionnées) */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3 text-gray-700">
                          Moyennes période {selectedPlayers.length > 0 ? '(joueuses sélectionnées)' : '(toutes joueuses)'} - lignes pointillées
                        </h4>
                        <div className="space-y-2">
                          {selectedMetrics.map(metric => {
                            const metricInfo = metricsOptions.find(m => m.value === metric);
                            const filteredAvg = filteredAverages[metric];
                            return (
                              <div key={metric} className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-4 h-0.5 rounded border-dashed border-2"
                                    style={{borderColor: metricInfo?.color}}
                                  ></div>
                                  <span>{metricInfo?.label}:</span>
                                </div>
                                <span className="font-medium text-gray-600">
                                  {filteredAvg || 'N/A'}/20
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Moyennes globales (TOUTES les joueuses) */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3 text-gray-700">
                          Moyennes globales (toutes joueuses)
                        </h4>
                        <div className="space-y-2">
                          {selectedMetrics.map(metric => {
                            const metricInfo = metricsOptions.find(m => m.value === metric);
                            const globalAvg = globalAverages[metric];
                            return (
                              <div key={metric} className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{backgroundColor: metricInfo?.color}}
                                  ></div>
                                  <span>{metricInfo?.label}:</span>
                                </div>
                                <span className="font-bold text-gray-700">
                                  {globalAvg || 'N/A'}/20
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Informations sur les données */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>Lecture du graphique:</strong> Les <strong>lignes pleines</strong> montrent la moyenne quotidienne des joueuses ayant répondu ce jour-là. 
                        Les <strong>lignes pointillées</strong> représentent la moyenne sur toute la période pour les joueuses {selectedPlayers.length > 0 ? 'sélectionnées' : '(toutes)'}. 
                        Les <strong>moyennes globales</strong> (à droite) concernent TOUTES les joueuses de l'équipe, peu importe le filtre.
                      </p>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Statistiques contextuelles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600">
                {selectedPlayers.length > 0 ? selectedPlayers.length : players.length}
              </div>
              <div className="text-sm text-gray-600">Joueuses analysées</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">
                {selectedMetrics.length}
              </div>
              <div className="text-sm text-gray-600">Métriques suivies</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-600">
                {selectedQuestionTypes.length}
              </div>
              <div className="text-sm text-gray-600">Types de questionnaire</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {Object.values(playerStats).reduce((sum, stat) => sum + (stat.total_responses || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Réponses totales</div>
            </div>
          </div>
        </div>

        {/* Section 3: Gestion des objectifs */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{color: '#1D2945'}}>
              <BarChart3 className="inline mr-2" size={24} />
              Gestion des Objectifs
            </h2>
            <button
              onClick={() => setEditingObjectives(!editingObjectives)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all"
            >
              <Edit3 size={16} />
              <span>{editingObjectives ? 'Terminer' : 'Modifier'}</span>
            </button>
          </div>

          {/* Objectifs collectifs */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Objectifs Collectifs de l'Équipe</h3>
            {editingObjectives ? (
              <div className="space-y-3">
                <textarea
                  value={objectifsCollectifs}
                  onChange={(e) => setObjectifsCollectifs(e.target.value)}
                  placeholder="Entrez les objectifs collectifs de l'équipe..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
                <button
                  onClick={saveObjectifsCollectifs}
                  disabled={loading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all disabled:opacity-50"
                >
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  {objectifsCollectifs || 'Aucun objectif collectif défini.'}
                </p>
              </div>
            )}
          </div>

          {/* Objectifs individuels */}
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
                          <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold" 
                               style={{background: 'linear-gradient(135deg, #1D2945 0%, #C09D5A 100%)'}}>
                            {player.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900">{player.name}</h4>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        Objectifs Techniques
                      </label>
                      <textarea
                        value={objectifsIndividuels[player.id] || ''}
                        onChange={(e) => setObjectifsIndividuels(prev => ({
                          ...prev,
                          [player.id]: e.target.value
                        }))}
                        placeholder="Objectifs techniques..."
                        className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        rows={3}
                      />
                      <button
                        onClick={() => saveObjectifsIndividuels(player.id, objectifsIndividuels[player.id] || '')}
                        disabled={loading}
                        className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        Sauvegarder
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">
                        Objectifs Mentaux
                      </label>
                      <textarea
                        value={objectifsMentaux[player.id] || ''}
                        onChange={(e) => setObjectifsMentaux(prev => ({
                          ...prev,
                          [player.id]: e.target.value
                        }))}
                        placeholder="Objectifs mentaux..."
                        className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                        rows={3}
                      />
                      <button
                        onClick={() => saveObjectifsMentaux(player.id, objectifsMentaux[player.id] || '')}
                        disabled={loading}
                        className="mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        Sauvegarder
                      </button>
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
