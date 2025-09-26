// views/AdminPanel.jsx - Version améliorée avec interface visuelle
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

  // Fonction pour générer les données du graphique filtré (adaptée au multi-sélection)
  const getFilteredChartData = () => {
    const playersToShow = selectedPlayers.length > 0 ? 
      players.filter(p => selectedPlayers.includes(p.id)) : 
      players;

    return selectedMetrics.map(metric => {
      const metricInfo = metricsOptions.find(m => m.value === metric);
      const data = playersToShow.map(player => {
        const responses = player.responses || [];
        
        // Filtrer par types de questionnaires (support multi-sélection)
        let filteredResponses = responses;
        if (!selectedQuestionTypes.includes('all')) {
          filteredResponses = responses.filter(r => selectedQuestionTypes.includes(r.type));
        }

        // Calculer la métrique
        let value = 0;
        if (filteredResponses.length > 0) {
          const validValues = filteredResponses
            .map(r => r.data?.[metric])
            .filter(v => v != null && !isNaN(v));
          
          if (validValues.length > 0) {
            value = validValues.reduce((sum, v) => sum + Number(v), 0) / validValues.length;
          }
        }

        return {
          name: player.name.split(' ')[0],
          fullName: player.name,
          value: Number(value.toFixed(1)),
          responses: filteredResponses.length,
          metric: metric
        };
      }).sort((a, b) => b.value - a.value);

      return {
        metric: metric,
        label: metricInfo?.label || metric,
        color: metricInfo?.color || '#1D2945',
        data: data
      };
    });
  };

  // Fonctions pour gérer les sélections multiples
  const togglePlayerSelection = (playerId) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const toggleMetricSelection = (metric) => {
    setSelectedMetrics(prev => 
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const toggleQuestionTypeSelection = (type) => {
    setSelectedQuestionTypes(prev => {
      // Si on sélectionne "all", on désélectionne les autres
      if (type === 'all') {
        return ['all'];
      }
      // Si on sélectionne autre chose, on enlève "all"
      const newSelection = prev.filter(t => t !== 'all');
      return newSelection.includes(type)
        ? newSelection.filter(t => t !== type)
        : [...newSelection, type];
    });
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
  const chartData = getFilteredChartData();

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

        {/* Section 1: Grille des joueuses (style interface principale) */}
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
                {/* Bouton suppression */}
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
                  {/* Photo de profil */}
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

                  {/* Nom joueuse */}
                  <h3 className="font-bold text-lg mb-3" style={{color: '#1D2945'}}>
                    {player.name}
                  </h3>
                  
                  {/* Indicateurs de statut */}
                  <div className="flex justify-center space-x-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  </div>

                  {/* Statistiques */}
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
          
          {/* Filtres améliorés avec sélections multiples */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
              <Filter size={20} className="mr-2" />
              Filtres d'Analyse
            </h3>
            
            {/* Sélection des joueuses */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Joueuses sélectionnées</label>
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => setSelectedPlayers([])}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    selectedPlayers.length === 0 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Toutes ({players.length})
                </button>
                {players.map(player => (
                  <button
                    key={player.id}
                    onClick={() => togglePlayerSelection(player.id)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      selectedPlayers.includes(player.id)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {player.name.split(' ')[0]}
                  </button>
                ))}
              </div>
              {selectedPlayers.length > 0 && (
                <p className="text-xs text-blue-600">
                  {selectedPlayers.length} joueuse(s) sélectionnée(s)
                </p>
              )}
            </div>

            {/* Sélection des métriques */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Métriques à analyser</label>
              <div className="flex flex-wrap gap-2">
                {metricsOptions.map(metric => (
                  <button
                    key={metric.value}
                    onClick={() => toggleMetricSelection(metric.value)}
                    className={`px-3 py-1 rounded-full text-sm transition-all border-2 ${
                      selectedMetrics.includes(metric.value)
                        ? 'text-white border-transparent'
                        : 'text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                    style={{
                      backgroundColor: selectedMetrics.includes(metric.value) ? metric.color : 'transparent'
                    }}
                  >
                    {metric.label}
                  </button>
                ))}
              </div>
              {selectedMetrics.length > 0 && (
                <p className="text-xs text-green-600 mt-2">
                  {selectedMetrics.length} métrique(s) sélectionnée(s)
                </p>
              )}
            </div>

            {/* Sélection des types de questionnaires */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Types de questionnaires</label>
              <div className="flex flex-wrap gap-2">
                {questionTypeOptions.map(type => (
                  <button
                    key={type.value}
                    onClick={() => toggleQuestionTypeSelection(type.value)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      selectedQuestionTypes.includes(type.value)
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              {selectedQuestionTypes.length > 0 && (
                <p className="text-xs text-purple-600 mt-2">
                  {selectedQuestionTypes.join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Graphiques avec métriques multiples */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Comparaison des Métriques Sélectionnées
            </h3>
            
            {getFilteredChartData().map((metricData, index) => (
              <div key={metricData.metric} className="mb-8">
                <h4 className="text-md font-medium mb-3" style={{color: metricData.color}}>
                  {metricData.label} - {questionTypeOptions.find(t => selectedQuestionTypes.includes(t.value) || selectedQuestionTypes.includes('all'))?.label || 'Filtres personnalisés'}
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metricData.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 20]} />
                    <Tooltip formatter={(value, name, props) => [
                      `${value}/20`,
                      metricData.label,
                      `${props.payload.responses} réponses`
                    ]} />
                    <Bar dataKey="value" fill={metricData.color} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
            
            {selectedMetrics.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 size={48} className="mx-auto mb-4" />
                <p>Sélectionnez au moins une métrique pour afficher les graphiques</p>
              </div>
            )}
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

        {/* Section 3: Gestion des objectifs avec objectifs individuels */}
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

          {/* Objectifs individuels par joueuse */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Objectifs Individuels par Joueuse</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {players.map(player => (
                <div key={player.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
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
                  
                  {/* Objectifs techniques */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Objectifs Techniques
                    </label>
                    {editingObjectives ? (
                      <div className="space-y-2">
                        <textarea
                          value={objectifsIndividuels[player.id] || ''}
                          onChange={(e) => setObjectifsIndividuels(prev => ({
                            ...prev,
                            [player.id]: e.target.value
                          }))}
                          placeholder="Objectifs techniques..."
                          className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          rows={2}
                        />
                        <button
                          onClick={() => saveObjectifsIndividuels(player.id, objectifsIndividuels[player.id] || '')}
                          disabled={loading}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                        </button>
                      </div>
                    ) : (
                      <div className="p-2 bg-blue-50 rounded text-sm">
                        {objectifsIndividuels[player.id] || 'Aucun objectif technique défini.'}
                      </div>
                    )}
                  </div>

                  {/* Objectifs mentaux */}
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Objectifs Mentaux
                    </label>
                    {editingObjectives ? (
                      <div className="space-y-2">
                        <textarea
                          value={objectifsMentaux[player.id] || ''}
                          onChange={(e) => setObjectifsMentaux(prev => ({
                            ...prev,
                            [player.id]: e.target.value
                          }))}
                          placeholder="Objectifs mentaux..."
                          className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                          rows={2}
                        />
                        <button
                          onClick={() => saveObjectifsMentaux(player.id, objectifsMentaux[player.id] || '')}
                          disabled={loading}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                        </button>
                      </div>
                    ) : (
                      <div className="p-2 bg-green-50 rounded text-sm">
                        {objectifsMentaux[player.id] || 'Aucun objectif mental défini.'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
