
import React, { useState, useEffect } from 'react';
import { User, Plus, Edit3, BarChart3, Calendar, Target, Heart, Users, ChevronLeft, ChevronRight, Save, UserPlus, Lock, Eye, EyeOff, Settings, Camera, Download, TrendingUp, Upload, Trash2 } from 'lucide-react';
import { supabase } from './supabaseClient';

const FutsalApp = () => {
  const [currentView, setCurrentView] = useState('login');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [questionnaireSelf, setQuestionnaireSelf] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playerStats, setPlayerStats] = useState({});
  
  const [players, setPlayers] = useState([]);
  
  const [preSessionForm, setPreSessionForm] = useState({
    motivation: 10,
    fatigue: 10,
    plaisir: 10,
    objectif_difficulte: 10
  });
  
  const [postSessionForm, setPostSessionForm] = useState({
    objectifs_repondu: 10,
    intensite_rpe: 10,
    plaisir_seance: 10,
    tactique: 10,
    technique: 10,
    influence_positive: 10,
    sentiment_groupe: 10,
    commentaires_libres: ''
  });

  // États pour la gestion des objectifs
  const [objectifsCollectifs, setObjectifsCollectifs] = useState('');
  const [objectifsIndividuels, setObjectifsIndividuels] = useState({});
  const [editingObjectives, setEditingObjectives] = useState(false);

  // Fonction pour activer/désactiver le mode admin
  const toggleAdminMode = () => {
    if (!isAdmin) {
      const pwd = prompt('Mot de passe entraîneur :');
      if (pwd === 'coachNmf_2026') {
        setIsAdmin(true);
        alert('Mode entraîneur activé');
      } else if (pwd) {
        alert('Mot de passe incorrect');
      }
    } else {
      setIsAdmin(false);
    }
  };

  // Charger les joueurs depuis Supabase
  const loadPlayers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      
      // Charger les réponses pour chaque joueur
      const playersWithResponses = await Promise.all(
        data.map(async (player) => {
          const { data: responses, error: respError } = await supabase
            .from('responses')
            .select('*')
            .eq('player_id', player.id)
            .order('created_at', { ascending: false });
          
          if (respError) {
            console.error('Erreur chargement réponses:', respError);
            return { ...player, responses: [] };
          }
          
          return { ...player, responses: responses || [] };
        })
      );
      
      setPlayers(playersWithResponses);
      loadPlayerStatistics(playersWithResponses);
      
      // Charger les objectifs
      await loadObjectifs();
    } catch (error) {
      console.error('Erreur lors du chargement des joueurs:', error);
      alert('Erreur lors du chargement des données');
    }
    setLoading(false);
  };

  // Charger les objectifs depuis Supabase
  const loadObjectifs = async () => {
    try {
      // Charger les objectifs collectifs
      const { data: collectifs, error: errorCollectifs } = await supabase
        .from('team_settings')
        .select('value')
        .eq('key', 'objectifs_collectifs')
        .maybeSingle();
      
      if (errorCollectifs && errorCollectifs.code !== 'PGRST116') {
        console.error('Erreur chargement objectifs collectifs:', errorCollectifs);
      } else {
        setObjectifsCollectifs(collectifs?.value || '');
      }

      // Charger les objectifs individuels pour chaque joueur
      const { data: individuels, error: errorIndividuels } = await supabase
        .from('players')
        .select('id, objectifs_individuels')
        .eq('is_active', true);

      if (errorIndividuels) {
        console.error('Erreur chargement objectifs individuels:', errorIndividuels);
      } else {
        const objIndiv = {};
        individuels?.forEach(player => {
          objIndiv[player.id] = player.objectifs_individuels || '';
        });
        setObjectifsIndividuels(objIndiv);
      }

    } catch (error) {
      console.error('Erreur chargement objectifs:', error);
    }
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

  // Charger les statistiques
  const loadPlayerStatistics = async (playersData = players) => {
    const stats = {};
    playersData.forEach(player => {
      const preResponses = player.responses?.filter(r => r.type === 'pre') || [];
      const postResponses = player.responses?.filter(r => r.type === 'post') || [];
      
      stats[player.id] = {
        total_responses: player.responses?.length || 0,
        pre_session_responses: preResponses.length,
        post_session_responses: postResponses.length,
        avg_motivation: preResponses.length > 0 
          ? (preResponses.reduce((sum, r) => sum + (r.data?.motivation || 0), 0) / preResponses.length).toFixed(1)
          : 0,
        avg_fatigue: preResponses.length > 0
          ? (preResponses.reduce((sum, r) => sum + (r.data?.fatigue || 0), 0) / preResponses.length).toFixed(1)
          : 0,
        avg_rpe: postResponses.length > 0
          ? (postResponses.reduce((sum, r) => sum + (r.data?.intensite_rpe || 0), 0) / postResponses.length).toFixed(1)
          : 0,
        last_response_date: player.responses?.length > 0 
          ? new Date(Math.max(...player.responses.map(r => new Date(r.created_at)))).toLocaleDateString('fr-FR')
          : null
      };
    });
    setPlayerStats(stats);
  };

  // Charger les joueurs quand l'utilisateur est authentifié
  useEffect(() => {
    if (isAuthenticated) {
      loadPlayers();
    }
  }, [isAuthenticated]);

  // Authentification
  const handleSiteLogin = () => {
    if (password === 'NMF2026') {
      setIsAuthenticated(true);
      setCurrentView('players');
      setPassword('');
    } else {
      alert('Mot de passe incorrect');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setCurrentView('login');
    setSelectedPlayer(null);
  };

  // Upload de photo
  const handlePhotoUpload = async (playerId, file) => {
    if (!file) return;
    
    setLoading(true);
    try {
      // Upload vers Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${playerId}-${Date.now()}.${fileExt}`;
      const filePath = `player-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: publicUrl } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      // Mettre à jour le player
      const { error: updateError } = await supabase
        .from('players')
        .update({ photo_url: publicUrl.publicUrl })
        .eq('id', playerId);

      if (updateError) throw updateError;

      // Mettre à jour l'état local
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

      // Convertir en CSV
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

      // Télécharger
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

  // Fonction pour supprimer un joueur
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

  // Composant curseur
  const ScaleQuestion = ({ question, value, onChange, leftLabel, rightLabel }) => (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        {question}
      </label>
      <div className="px-2">
        <input
          type="range"
          min="1"
          max="20"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #fecaca 0%, #fef3c7 50%, #bbf7d0 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-gray-600 mt-2 font-medium">
          <span>{leftLabel}</span>
          <span className="text-center font-bold">{value}/20</span>
          <span>{rightLabel}</span>
        </div>
      </div>
    </div>
  );

  // Composant carte joueur
  const PlayerCard = ({ player, onClick, showAdminActions = false }) => (
    <div 
      className="bg-white rounded-xl shadow-lg p-4 transform hover:scale-105 transition-all duration-200 border-l-4 hover:shadow-xl relative"
      style={{borderLeftColor: '#C09D5A'}}
    >
      {showAdminActions && (
        <div className="absolute top-2 right-2 flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => handlePhotoUpload(player.id, e.target.files[0]);
              input.click();
            }}
            className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            title="Changer la photo"
          >
            <Camera size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deletePlayer(player.id);
            }}
            className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            title="Désactiver joueuse"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
      
      <div 
        onClick={() => onClick(player)}
        className="flex flex-col items-center space-y-3 cursor-pointer"
      >
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
          {player.photo_url ? (
            <img 
              src={player.photo_url} 
              alt={player.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold" style={{background: 'linear-gradient(135deg, #1D2945 0%, #C09D5A 100%)'}}>
              {player.name.split(' ').map(n => n[0]).join('')}
            </div>
          )}
        </div>
        <h3 className="font-semibold text-center" style={{color: '#1D2945'}}>{player.name}</h3>
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#1D2945'}}></div>
          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#C09D5A'}}></div>
          <div className={`w-3 h-3 rounded-full ${player.responses?.length > 0 ? 'bg-green-400' : 'bg-gray-300'}`}></div>
        </div>
      </div>
    </div>
  );

  // Sauvegarder questionnaire
  const saveQuestionnaire = async (type) => {
    if (!selectedPlayer) return;
    
    setLoading(true);
    const formData = type === 'pre' ? preSessionForm : postSessionForm;
    
    try {
      const { error } = await supabase
        .from('responses')
        .insert({
          player_id: selectedPlayer.id,
          type: type,
          data: formData
        });
      
      if (error) throw error;
      
      alert('Questionnaire sauvegardé !');
      
      // Réinitialiser le formulaire
      if (type === 'pre') {
        setPreSessionForm({
          motivation: 10,
          fatigue: 10,
          plaisir: 10,
          objectif_difficulte: 10
        });
      } else {
        setPostSessionForm({
          objectifs_repondu: 10,
          intensite_rpe: 10,
          plaisir_seance: 10,
          tactique: 10,
          technique: 10,
          influence_positive: 10,
          sentiment_groupe: 10,
          commentaires_libres: ''
        });
      }
      
      // Recharger les données
      await loadPlayers();
      setCurrentView('player-detail');
      
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
    setLoading(false);
  };

  // Mettre à jour les objectifs
  const updateObjectives = async () => {
    if (!selectedPlayer) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('players')
        .update({
          objectives: questionnaireSelf.objectives || '',
          objectifs_individuels: questionnaireSelf.objectifs_individuels || ''
        })
        .eq('id', selectedPlayer.id);
      
      if (error) throw error;
      
      alert('Objectifs sauvegardés !');
      await loadPlayers();
      
      // Mettre à jour le joueur sélectionné
      setSelectedPlayer(prev => ({
        ...prev,
        objectives: questionnaireSelf.objectives || '',
        objectifs_individuels: questionnaireSelf.objectifs_individuels || ''
      }));
      
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      alert('Erreur lors de la sauvegarde');
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

  // Écran de connexion
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{background: 'linear-gradient(135deg, #1D2945 0%, #C09D5A 100%)'}}>
              <Lock className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{color: '#1D2945'}}>Suivi Équipe Futsal</h1>
            <p className="text-gray-600">Nantes Métropole Futsal</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mot de passe d'accès
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                placeholder="Entrez le mot de passe"
                onKeyPress={(e) => e.key === 'Enter' && handleSiteLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <button
            onClick={handleSiteLogin}
            disabled={!password || loading}
            className="w-full text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{background: 'linear-gradient(135deg, #1D2945 0%, #2563eb 100%)'}}
          >
            {loading ? 'Connexion...' : 'Accéder à l\'application'}
          </button>
          
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Accès réservé aux membres de l'équipe</p>
            <p>Nantes Métropole Futsal</p>
          </div>
        </div>
      </div>
    );
  }

  // PANNEAU D'ADMINISTRATION
  if (currentView === 'admin' && isAdmin) {
    return (
      <div className="min-h-screen p-4" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
        <div className="max-w-6xl mx-auto">
          {/* En-tête */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold" style={{color: '#1D2945'}}>
                  Administration
                </h1>
                <p className="text-gray-600 mt-1">Panneau d'administration - Mode Entraîneur</p>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Section Gestion des joueuses */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{color: '#1D2945'}}>
                  Gestion des Joueuses
                </h2>
                <div className="flex space-x-3">
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
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                  >
                    <Download size={16} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {players.map(player => (
                  <div key={player.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div 
                      onClick={() => {
                        setSelectedPlayer(player);
                        setCurrentView('admin-player-detail');
                      }}
                      className="flex items-center space-x-4 flex-1 cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                        {player.photo_url ? (
                          <img 
                            src={player.photo_url} 
                            alt={player.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold" style={{background: 'linear-gradient(135deg, #1D2945 0%, #C09D5A 100%)'}}>
                            {player.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{color: '#1D2945'}}>{player.name}</h3>
                        <p className="text-sm text-gray-600">
                          {playerStats[player.id]?.total_responses || 0} réponses • Cliquez pour voir le détail
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => handlePhotoUpload(player.id, e.target.files[0]);
                          input.click();
                        }}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        title="Changer la photo"
                      >
                        <Camera size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePlayer(player.id);
                        }}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Désactiver joueuse"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section Gestion des Objectifs */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{color: '#1D2945'}}>
                  Gestion des Objectifs
                </h2>
                <button
                  onClick={() => setEditingObjectives(!editingObjectives)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    editingObjectives 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <Edit3 size={16} />
                  <span>{editingObjectives ? 'Terminer' : 'Modifier'}</span>
                </button>
              </div>

              {/* Objectifs Collectifs */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3" style={{color: '#1D2945'}}>
                  Objectifs Collectifs de l'Équipe
                </h3>
                {editingObjectives ? (
                  <div className="space-y-3">
                    <textarea
                      value={objectifsCollectifs}
                      onChange={(e) => setObjectifsCollectifs(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-blue-500"
                      rows="4"
                      placeholder="Définissez les objectifs collectifs de l'équipe pour cette période..."
                    />
                    <button
                      onClick={saveObjectifsCollectifs}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Sauvegarde...' : 'Sauvegarder Objectifs Collectifs'}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-700">
                      {objectifsCollectifs || 'Aucun objectif collectif défini pour le moment.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Objectifs Individuels */}
              <div>
                <h3 className="text-lg font-semibold mb-3" style={{color: '#1D2945'}}>
                  Objectifs Individuels
                </h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {players.map(player => (
                    <div key={player.id} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                          {player.photo_url ? (
                            <img 
                              src={player.photo_url} 
                              alt={player.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold" style={{background: 'linear-gradient(135deg, #1D2945 0%, #C09D5A 100%)'}}>
                              {player.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium">{player.name}</h4>
                      </div>
                      
                      {editingObjectives ? (
                        <div className="space-y-2">
                          <textarea
                            value={objectifsIndividuels[player.id] || ''}
                            onChange={(e) => setObjectifsIndividuels(prev => ({
                              ...prev,
                              [player.id]: e.target.value
                            }))}
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:border-blue-500"
                            rows="2"
                            placeholder="Objectifs personnels pour cette joueuse..."
                          />
                          <button
                            onClick={() => saveObjectifsIndividuels(player.id, objectifsIndividuels[player.id] || '')}
                            disabled={loading}
                            className="text-sm px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                          >
                            Sauvegarder
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {objectifsIndividuels[player.id] || 'Aucun objectif individuel défini.'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section Statistiques déplacée en bas */}
          <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
            <h2 className="text-2xl font-bold mb-6" style={{color: '#1D2945'}}>
              Statistiques Globales
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">{players.length}</div>
                  <div className="text-sm text-gray-600">Joueuses actives</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {Object.values(playerStats).reduce((sum, stat) => sum + stat.total_responses, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Réponses totales</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3" style={{color: '#1D2945'}}>Top 5 - Participation</h3>
                <div className="space-y-2">
                  {players
                    .sort((a, b) => (playerStats[b.id]?.total_responses || 0) - (playerStats[a.id]?.total_responses || 0))
                    .slice(0, 5)
                    .map(player => (
                      <div key={player.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-medium">{player.name}</span>
                        <span className="text-sm text-gray-600">
                          {playerStats[player.id]?.total_responses || 0} réponses
                        </span>
                      </div>
                    ))
                  }
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3" style={{color: '#1D2945'}}>Moyennes d'équipe</h3>
                <div className="space-y-3">
                  {(() => {
                    const allStats = Object.values(playerStats);
                    const avgMotivation = allStats.length > 0 
                      ? (allStats.reduce((sum, stat) => sum + parseFloat(stat.avg_motivation || 0), 0) / allStats.length).toFixed(1)
                      : 0;
                    const avgFatigue = allStats.length > 0
                      ? (allStats.reduce((sum, stat) => sum + parseFloat(stat.avg_fatigue || 0), 0) / allStats.length).toFixed(1)
                      : 0;
                    const avgRpe = allStats.length > 0
                      ? (allStats.reduce((sum, stat) => sum + parseFloat(stat.avg_rpe || 0), 0) / allStats.length).toFixed(1)
                      : 0;

                    return (
                      <>
                        <div className="flex justify-between">
                          <span>Motivation moyenne :</span>
                          <span className="font-bold">{avgMotivation}/20</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fatigue moyenne :</span>
                          <span className="font-bold">{avgFatigue}/20</span>
                        </div>
                        <div className="flex justify-between">
                          <span>RPE moyen :</span>
                          <span className="font-bold">{avgRpe}/20</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vue détail joueuse pour l'admin
  if (currentView === 'admin-player-detail' && selectedPlayer && isAdmin) {
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
                    {playerStats[selectedPlayer.id].last_response_date && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-semibold text-gray-700">
                          Dernière réponse
                        </div>
                        <div className="text-xs text-gray-600">
                          {playerStats[selectedPlayer.id].last_response_date}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Objectifs personnels */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4" style={{color: '#1D2945'}}>Objectifs Personnels</h2>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-gray-700 text-sm">
                    {objectifsIndividuels[selectedPlayer.id] || 'Aucun objectif personnel défini.'}
                  </p>
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
                              {response.type === 'pre' ? '📋 Pré-séance' : '📊 Post-séance'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {new Date(response.created_at).toLocaleDateString('fr-FR')} à {new Date(response.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                            </p>
                          </div>
                        </div>

                        {/* Détail des réponses */}
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
                              {response.data.objectif_difficulte && (
                                <div className="bg-purple-50 p-2 rounded">
                                  <div className="text-xs text-gray-600">Difficulté objectifs</div>
                                  <div className="font-semibold text-purple-700">{response.data.objectif_difficulte}/20</div>
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
                              {response.data.influence_positive && (
                                <div className="bg-teal-50 p-2 rounded">
                                  <div className="text-xs text-gray-600">Influence positive</div>
                                  <div className="font-semibold text-teal-700">{response.data.influence_positive}/20</div>
                                </div>
                              )}
                              {response.data.sentiment_groupe && (
                                <div className="bg-pink-50 p-2 rounded">
                                  <div className="text-xs text-gray-600">Sentiment groupe</div>
                                  <div className="font-semibold text-pink-700">{response.data.sentiment_groupe}/20</div>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Commentaires */}
                        {response.data.commentaires_libres && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-xs font-semibold text-gray-600 mb-1">Commentaires :</div>
                            <p className="text-sm text-gray-700 italic">"{response.data.commentaires_libres}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <BarChart3 size={48} className="mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucune réponse enregistrée</h3>
                    <p className="text-gray-500">Cette joueuse n'a pas encore rempli de questionnaire.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interface principale
  if (currentView === 'players') {
    return (
      <div className="min-h-screen p-4" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{background: 'linear-gradient(135deg, #1D2945 0%, #C09D5A 100%)'}}>
            <div className="text-white text-2xl font-bold">⚽</div>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{color: '#1D2945'}}>Équipe Futsal Féminine</h1>
          <p className="text-gray-600">Nantes Métropole Futsal</p>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center space-y-4 mb-8">
            {/* Ligne du haut : Mode Entraîneur + Déconnexion */}
            <div className="flex space-x-4">
              <button
                onClick={toggleAdminMode}
                className={`px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  !isAdmin 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'text-white shadow-lg'
                }`}
                style={isAdmin ? {background: 'linear-gradient(135deg, #1D2945 0%, #2563eb 100%)'} : {}}
              >
                {!isAdmin ? '👤 Mode Entraîneur' : '✅ Mode Entraîneur'}
              </button>
              
              <button
                onClick={logout}
                className="px-6 py-3 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-all transform hover:scale-105"
              >
                🚪 Déconnexion
              </button>
            </div>
            
            {/* Ligne du bas : Boutons admin */}
            {isAdmin && (
              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentView('admin')}
                  className="px-6 py-3 rounded-lg font-medium text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  style={{background: 'linear-gradient(135deg, #1D2945 0%, #2563eb 100%)'}}
                >
                  ⚙️ Administration
                </button>
                
                <button
                  onClick={addNewPlayer}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg font-medium text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50"
                  style={{background: 'linear-gradient(135deg, #C09D5A 0%, #d4a574 100%)'}}
                >
                  ➕ Ajouter Joueuse
                </button>
              </div>
            )}
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="text-lg" style={{color: '#1D2945'}}>Chargement...</div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {players.map(player => (
              <PlayerCard 
                key={player.id} 
                player={player} 
                onClick={(p) => {
                  setSelectedPlayer(p);
                  setCurrentView('player-detail');
                }}
                showAdminActions={isAdmin}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Vue détail d'un joueur
  if (currentView === 'player-detail' && selectedPlayer) {
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

          {/* Actions rapides */}
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
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {playerStats[selectedPlayer.id].avg_motivation}
                  </div>
                  <div className="text-sm text-gray-600">Motivation moy.</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {playerStats[selectedPlayer.id].avg_rpe}
                  </div>
                  <div className="text-sm text-gray-600">RPE moyen</div>
                </div>
              </div>
            </div>
          )}

          {/* Historique des réponses */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6" style={{color: '#1D2945'}}>Historique des Réponses</h2>
            {selectedPlayer.responses && selectedPlayer.responses.length > 0 ? (
              <div className="space-y-4">
                {selectedPlayer.responses.slice(0, 10).map(response => (
                  <div key={response.id} className="border-l-4 border-gray-200 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">
                          {response.type === 'pre' ? 'Pré-séance' : 'Post-séance'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(response.created_at).toLocaleDateString('fr-FR')} à {new Date(response.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                        </div>
                      </div>
                      <div className="text-sm">
                        {response.type === 'pre' && response.data.motivation && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Motivation: {response.data.motivation}/20
                          </span>
                        )}
                        {response.type === 'post' && response.data.intensite_rpe && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            RPE: {response.data.intensite_rpe}/20
                          </span>
                        )}
                      </div>
                    </div>
                    {response.data.commentaires_libres && (
                      <div className="mt-2 text-sm text-gray-700 italic">
                        "{response.data.commentaires_libres}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">Aucune réponse enregistrée</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vue questionnaire pré-séance
  if (currentView === 'pre-session' && selectedPlayer) {
    return (
      <div className="min-h-screen p-4" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold" style={{color: '#1D2945'}}>Questionnaire Pré-Séance</h1>
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
              {/* Affichage des objectifs */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold mb-3" style={{color: '#1D2945'}}>
                  🎯 Objectifs pour cette séance
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
                
                {/* Objectifs Individuels */}
                {selectedPlayer && objectifsIndividuels[selectedPlayer.id] && (
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">Vos objectifs personnels :</h4>
                    <div className="bg-white p-3 rounded border-l-4 border-green-400">
                      <p className="text-gray-700 whitespace-pre-wrap">{objectifsIndividuels[selectedPlayer.id]}</p>
                    </div>
                  </div>
                )}
                
                {!objectifsCollectifs && (!selectedPlayer || !objectifsIndividuels[selectedPlayer.id]) && (
                  <p className="text-gray-600 italic">Aucun objectif défini pour cette séance.</p>
                )}
              </div>

              <ScaleQuestion
                question="Comment évaluez-vous votre motivation pour cette séance ?"
                value={preSessionForm.motivation}
                onChange={(value) => setPreSessionForm({...preSessionForm, motivation: value})}
                leftLabel="Très faible"
                rightLabel="Très élevée"
              />

              <ScaleQuestion
                question="Comment évaluez-vous votre niveau de fatigue ?"
                value={preSessionForm.fatigue}
                onChange={(value) => setPreSessionForm({...preSessionForm, fatigue: value})}
                leftLabel="Très fatigué"
                rightLabel="Très en forme"
              />

              <ScaleQuestion
                question="À quel point anticipez-vous prendre du plaisir durant cette séance ?"
                value={preSessionForm.plaisir}
                onChange={(value) => setPreSessionForm({...preSessionForm, plaisir: value})}
                leftLabel="Aucun plaisir"
                rightLabel="Énormément de plaisir"
              />

              <ScaleQuestion
                question="Comment évaluez-vous la difficulté des objectifs que vous vous fixez pour cette séance ?"
                value={preSessionForm.objectif_difficulte}
                onChange={(value) => setPreSessionForm({...preSessionForm, objectif_difficulte: value})}
                leftLabel="Très faciles"
                rightLabel="Très difficiles"
              />
            </div>

            <button
              onClick={() => saveQuestionnaire('pre')}
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
  }

  // Vue questionnaire post-séance
  if (currentView === 'post-session' && selectedPlayer) {
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
              <ScaleQuestion
                question="Dans quelle mesure vos objectifs ont-ils été atteints durant cette séance ?"
                value={postSessionForm.objectifs_repondu}
                onChange={(value) => setPostSessionForm({...postSessionForm, objectifs_repondu: value})}
                leftLabel="Pas du tout"
                rightLabel="Complètement"
              />

              <ScaleQuestion
                question="Comment évaluez-vous l'intensité de cette séance ? (RPE)"
                value={postSessionForm.intensite_rpe}
                onChange={(value) => setPostSessionForm({...postSessionForm, intensite_rpe: value})}
                leftLabel="Très facile"
                rightLabel="Très difficile"
              />

              <ScaleQuestion
                question="À quel point avez-vous pris du plaisir durant cette séance ?"
                value={postSessionForm.plaisir_seance}
                onChange={(value) => setPostSessionForm({...postSessionForm, plaisir_seance: value})}
                leftLabel="Aucun plaisir"
                rightLabel="Énormément de plaisir"
              />

              <ScaleQuestion
                question="Comment évaluez-vous vos progrès tactiques durant cette séance ?"
                value={postSessionForm.tactique}
                onChange={(value) => setPostSessionForm({...postSessionForm, tactique: value})}
                leftLabel="Aucun progrès"
                rightLabel="Énormes progrès"
              />

              <ScaleQuestion
                question="Comment évaluez-vous vos progrès techniques durant cette séance ?"
                value={postSessionForm.technique}
                onChange={(value) => setPostSessionForm({...postSessionForm, technique: value})}
                leftLabel="Aucun progrès"
                rightLabel="Énormes progrès"
              />

              <ScaleQuestion
                question="Dans quelle mesure avez-vous eu une influence positive sur le groupe ?"
                value={postSessionForm.influence_positive}
                onChange={(value) => setPostSessionForm({...postSessionForm, influence_positive: value})}
                leftLabel="Aucune influence"
                rightLabel="Très positive"
              />

              <ScaleQuestion
                question="Comment vous êtes-vous senti(e) dans le groupe durant cette séance ?"
                value={postSessionForm.sentiment_groupe}
                onChange={(value) => setPostSessionForm({...postSessionForm, sentiment_groupe: value})}
                leftLabel="Très mal intégré"
                rightLabel="Parfaitement intégré"
              />

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Commentaires libres (optionnel)
                </label>
                <textarea
                  value={postSessionForm.commentaires_libres}
                  onChange={(e) => setPostSessionForm({...postSessionForm, commentaires_libres: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  rows="4"
                  placeholder="Partagez vos impressions, suggestions ou remarques..."
                />
              </div>
            </div>

            <button
              onClick={() => saveQuestionnaire('post')}
              disabled={loading}
              className="w-full mt-8 py-4 text-white rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50"
              style={{background: 'linear-gradient(135deg, #1D2945 0%, #2563eb 100%)'}}
            >
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Retour par défaut - message d'erreur si aucune vue n'est trouvée
  return (
    <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
      <div className="text-center bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-4" style={{color: '#1D2945'}}>
          Vue non trouvée
        </h2>
        <button
          onClick={() => setCurrentView('players')}
          className="px-6 py-3 text-white rounded-lg"
          style={{backgroundColor: '#1D2945'}}
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
};

export default FutsalApp;

