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
  const [selectedMetric, setSelectedMetric] = useState('motivation'); // Métrique sélectionnée
  const [selectedQuestionType, setSelectedQuestionType] = useState('all'); // Type questionnaire
  const [detailViewPlayer, setDetailViewPlayer] = useState(null); // Vue détail joueuse

  // Options de métriques disponibles
  const metricsOptions = [
    { value: 'motivation', label: 'Motivation', color: '#2563eb' },
    { value: 'fatigue', label: 'Fatigue', color: '#dc2626' },
    { value: 'intensite_rpe', label: 'RPE (Intensité)', color: '#f59e0b' },
    { value: 'plaisir', label: 'Plaisir', color: '#10b981' },
    { value: 'confiance', label: 'Confiance', color: '#8b5cf6' }
  ];

  const questionTypeOptions = [
    { value: 'all', label: 'Tous les questionnaires' },
    { value: 'pre', label: 'Pré-séance' },
    { value: 'post', label: 'Post-séance' },
    { value: 'match', label: 'Match' }
  ];

  // Fonction pour générer les données du graphique filtré
  const getFilteredChartData = () => {
    const playersToShow = selectedPlayers.length > 0 ? 
      players.filter(p => selectedPlayers.includes(p.id)) : 
      players;

    return playersToShow.map(player => {
      const playerData = playerStats[player.id];
      const responses = player.responses || [];
      
      // Filtrer par type de questionnaire
      const filteredResponses = selectedQuestionType === 'all' ? 
        responses : 
        responses.filter(r => r.type === selectedQuestionType);

      // Calculer la métrique sélectionnée
      let value = 0;
      if (filteredResponses.length > 0) {
        const validValues = filteredResponses
          .map(r => r.data?.[selectedMetric])
          .filter(v => v != null && !isNaN(v));
        
        if (validValues.length > 0) {
          value = validValues.reduce((sum, v) => sum + Number(v), 0) / validValues.length;
        }
      }

      return {
        name: player.name.split(' ')[0], // Prénom seulement
        fullName: player.name,
        value: Number(value.toFixed(1)),
        responses: filteredResponses.length,
        total_responses: playerData?.total_responses || 0
      };
    }).sort((a, b) => b.value - a.value);
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
  const selectedMetricInfo = metricsOptions.find(m => m.value === selectedMetric);

  // Modal de détail joueuse
  const PlayerDetailModal = ({ player, onClose }) => {
    const stats = playerStats[player.id] || {};
    const chartData = stats.chartData || [];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
          <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                {player.photo_url ? (
                  <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold" 
                       style={{background: 'linear-gradient(135deg, #1D2945 0%, #C09D5A 100%)'}}>
                    {player.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{color: '#1D2945'}}>{player.name}</h2>
                <p className="text-gray-600">{stats.total_responses || 0} réponses totales</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Fermer
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Statistiques résumées */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.avg_motivation || 0}/20</div>
                <div className="text-sm text-gray-600">Motivation moyenne</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.avg_fatigue || 0}/20</div>
                <div className="text-sm text-gray-600">Fatigue moyenne</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.avg_rpe || 0}/20</div>
                <div className="text-sm text-gray-600">RPE moyen</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.pre_session_responses || 0}</div>
                <div className="text-sm text-gray-600">Questionnaires</div>
              </div>
            </div>

            {/* Graphique d'évolution */}
            {chartData.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Évolution des métriques</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 20]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="motivation" stroke="#2563eb" strokeWidth={2} name="Motivation" />
                    <Line type="monotone" dataKey="fatigue" stroke="#dc2626" strokeWidth={2} name="Fatigue" />
                    <Line type="monotone" dataKey="intensite_rpe" stroke="#f59e0b" strokeWidth={2} name="RPE" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Objectifs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Objectifs Techniques</h3>
                <textarea
                  value={objectifsIndividuels[player.id] || ''}
                  onChange={(e) => setObjectifsIndividuels(prev => ({
                    ...prev,
                    [player.id]: e.target.value
                  }))}
                  placeholder="Objectifs techniques..."
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  rows={4}
                />
                <button
                  onClick={() => saveObjectifsIndividuels(player.id, objectifsIndividuels[player.id] || '')}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Sauvegarder
                </button>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Objectifs Mentaux</h3>
                <textarea
                  value={objectifsMentaux[player.id] || ''}
                  onChange={(e) => setObjectifsMentaux(prev => ({
                    ...prev,
                    [player.id]: e.target.value
                  }))}
                  placeholder="Objectifs mentaux..."
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  rows={4}
                />
                <button
                  onClick={() => saveObjectifsMentaux(player.id, objectifsMentaux[player.id] || '')}
                  className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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

        {/* Section 1: Photos des joueuses cliquables */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{color: '#1D2945'}}>
            <Users className="inline mr-2" size={24} />
            Gestion des Joueuses
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {players.map(player => (
              <div key={player.id} className="relative group">
                <div 
                  className="w-24 h-24 rounded-full overflow-hidden border-3 border-gray-200 cursor-pointer hover:border-blue-400 transition-all mx-auto relative"
                  onClick={() => setDetailViewPlayer(player)}
                >
                  {player.photo_url ? (
                    <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold" 
                         style={{background: 'linear-gradient(135deg, #1D2945 0%, #C09D5A 100%)'}}>
                      {player.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  
                  {/* Overlay pour upload photo */}
                  <label className="absolute inset-0 cursor-pointer bg-black bg-opacity-0 hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <Camera size={20} className="text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files[0] && handlePhotoUpload(player.id, e.target.files[0])}
                    />
                  </label>
                </div>
                
                <div className="text-center mt-2">
                  <p className="text-sm font-medium truncate">{player.name.split(' ')[0]}</p>
                  <p className="text-xs text-gray-500">{playerStats[player.id]?.total_responses || 0} rép.</p>
                </div>
                
                {/* Bouton suppression */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePlayer(player.id);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                >
                  <Trash2 size={12} className="mx-auto" />
                </button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Joueuses</label>
              <select
                multiple
                value={selectedPlayers}
                onChange={(e) => setSelectedPlayers(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full p-2 border border-gray-300 rounded-lg"
                size="4"
              >
                {players.map(player => (
                  <option key={player.id} value={player.id}>{player.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Ctrl+clic pour sélection multiple</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Métrique</label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                {metricsOptions.map(metric => (
                  <option key={metric.value} value={metric.value}>{metric.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de questionnaire</label>
              <select
                value={selectedQuestionType}
                onChange={(e) => setSelectedQuestionType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                {questionTypeOptions.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Graphique */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4" style={{color: selectedMetricInfo?.color}}>
              {selectedMetricInfo?.label} - {questionTypeOptions.find(t => t.value === selectedQuestionType)?.label}
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 20]} />
                <Tooltip formatter={(value, name, props) => [
                  `${value}/20`,
                  selectedMetricInfo?.label,
                  `${props.payload.responses} réponses`
                ]} />
                <Bar dataKey="value" fill={selectedMetricInfo?.color || '#1D2945'} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Statistiques générales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600">{players.length}</div>
              <div className="text-sm text-gray-600">Joueuses actives</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600">
                {Object.values(playerStats).reduce((sum, stat) => sum + (stat.total_responses || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Réponses totales</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {chartData.length > 0 ? (chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length).toFixed(1) : '0'}
              </div>
              <div className="text-sm text-gray-600">{selectedMetricInfo?.label} moyenne</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-600">
                {chartData.reduce((sum, d) => sum + d.responses, 0)}
              </div>
              <div className="text-sm text-gray-600">Réponses filtrées</div>
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
          <div>
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
        </div>

        {/* Modal de détail joueuse */}
        {detailViewPlayer && (
          <PlayerDetailModal
            player={detailViewPlayer}
            onClose={() => setDetailViewPlayer(null)}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
