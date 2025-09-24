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
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render
  
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
    } catch (error) {
      console.error('Erreur lors du chargement des joueurs:', error);
      alert('Erreur lors du chargement des données');
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
  const PlayerCard = ({ player, onClick }) => (
    <div 
      onClick={() => onClick(player)}
      className="bg-white rounded-xl shadow-lg p-4 cursor-pointer transform hover:scale-105 transition-all duration-200 border-l-4 hover:shadow-xl"
      style={{borderLeftColor: '#C09D5A'}}
    >
      <div className="flex flex-col items-center space-y-3">
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

  // Composant graphique simple
  const SimpleChart = ({ data, title, color = '#1D2945' }) => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4" style={{color: '#1D2945'}}>{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{item.label}</span>
            <div className="flex items-center space-x-2">
              <div 
                className="h-2 rounded-full"
                style={{
                  width: `${Math.max(5, (item.value / 20) * 100)}px`,
                  backgroundColor: color,
                  opacity: 0.7
                }}
              ></div>
              <span className="text-sm font-medium" style={{color}}>{item.value}/20</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Sidebar admin
  const AdminSidebar = ({ currentSection, setCurrentSection }) => (
    <div className="w-64 bg-white shadow-lg h-full">
      <div className="p-6 border-b" style={{borderColor: '#C09D5A'}}>
        <h2 className="text-xl font-bold" style={{color: '#1D2945'}}>Administration</h2>
        <p className="text-sm text-gray-600">Nantes Métropole Futsal</p>
      </div>
      
      <nav className="p-4">
        {[
          { id: 'overview', icon: BarChart3, label: 'Vue d\'ensemble' },
          { id: 'players-admin', icon: Users, label: 'Gestion joueuses' },
          { id: 'analytics', icon: TrendingUp, label: 'Analytiques' },
          { id: 'photos', icon: Camera, label: 'Photos' },
          { id: 'export', icon: Download, label: 'Export données' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentSection(item.id)}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all mb-2 ${
              currentSection === item.id
                ? 'text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            style={currentSection === item.id ? {backgroundColor: '#1D2945'} : {}}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
        <button
          onClick={() => setCurrentView('players')}
          className="w-full flex items-center space-x-3 p-3 rounded-lg transition-all mb-2 text-gray-600 hover:bg-gray-50 border-t mt-4 pt-4"
          style={{borderColor: '#C09D5A'}}
        >
          <ChevronLeft size={20} />
          <span>Retour à l'app</span>
        </button>
      </nav>
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

  // Panneau d'administration
  if (currentView === 'admin') {
    const [adminSection, setAdminSection] = useState('overview');
    
    // Vue d'ensemble
    if (adminSection === 'overview') {
      const totalResponses = players.reduce((sum, p) => sum + (p.responses?.length || 0), 0);
      const activePlayersCount = players.filter(p => p.responses && p.responses.length > 0).length;
      const thisWeekResponses = players.reduce((sum, p) => {
        const thisWeek = p.responses?.filter(r => {
          const responseDate = new Date(r.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return responseDate > weekAgo;
        }).length || 0;
        return sum + thisWeek;
      }, 0);
      
      return (
        <div className="flex h-screen bg-gradient-main">
          <AdminSidebar currentSection={adminSection} setCurrentSection={setAdminSection} />
          <div className="flex-1 p-8 overflow-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold" style={{color: '#1D2945'}}>Vue d'ensemble</h1>
              <p className="text-gray-600">Dashboard administrateur - Équipe futsal féminine</p>
            </header>

            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Joueuses actives</p>
                    <p className="text-3xl font-bold" style={{color: '#1D2945'}}>{activePlayersCount}</p>
                  </div>
                  <Users className="text-4xl" style={{color: '#C09D5A'}} />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total réponses</p>
                    <p className="text-3xl font-bold" style={{color: '#1D2945'}}>{totalResponses}</p>
                  </div>
                  <BarChart3 className="text-4xl" style={{color: '#C09D5A'}} />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Cette semaine</p>
                    <p className="text-3xl font-bold" style={{color: '#1D2945'}}>{thisWeekResponses}</p>
                  </div>
                  <Calendar className="text-4xl" style={{color: '#C09D5A'}} />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Taux participation</p>
                    <p className="text-3xl font-bold" style={{color: '#1D2945'}}>
                      {Math.round((activePlayersCount / Math.max(1, players.length)) * 100)}%
                    </p>
                  </div>
                  <TrendingUp className="text-4xl" style={{color: '#C09D5A'}} />
                </div>
              </div>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimpleChart
                title="Motivation moyenne par joueuse"
                data={players.map(p => ({
                  label: p.name,
                  value: parseFloat(playerStats[p.id]?.avg_motivation || 0)
                })).filter(d => d.value > 0).slice(0, 6)}
                color="#22c55e"
              />
              
              <SimpleChart
                title="RPE moyen par joueuse"
                data={players.map(p => ({
                  label: p.name,
                  value: parseFloat(playerStats[p.id]?.avg_rpe || 0)
                })).filter(d => d.value > 0).slice(0, 6)}
                color="#ef4444"
              />
            </div>
          </div>
        </div>
      );
    }

    // Gestion des photos
    if (adminSection === 'photos') {
      return (
        <div className="flex h-screen bg-gradient-main">
          <AdminSidebar currentSection={adminSection} setCurrentSection={setAdminSection} />
          <div className="flex-1 p-8 overflow-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold" style={{color: '#1D2945'}}>Gestion des photos</h1>
              <p className="text-gray-600">Upload et gestion des photos des joueuses</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {players.map(player => (
                <div key={player.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200">
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
                    
                    <h3 className="font-semibold" style={{color: '#1D2945'}}>{player.name}</h3>
                    
                    <div className="w-full">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            handlePhotoUpload(player.id, e.target.files[0]);
                          }
                        }}
                        className="hidden"
                        id={`photo-${player.id}`}
                        disabled={loading}
                      />
                      <label
                        htmlFor={`photo-${player.id}`}
                        className={`w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Camera size={16} />
                        <span className="text-sm">
                          {loading ? 'Upload...' : player.photo_url ? 'Changer photo' : 'Ajouter photo'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Export des données
    if (adminSection === 'export') {
      return (
        <div className="flex h-screen bg-gradient-main">
          <AdminSidebar currentSection={adminSection} setCurrentSection={setAdminSection} />
          <div className="flex-1 p-8 overflow-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold" style={{color: '#1D2945'}}>Export des données</h1>
              <p className="text-gray-600">Téléchargez les données de l'application</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4" style={{color: '#1D2945'}}>Export complet CSV</h3>
                <p className="text-gray-600 mb-4">Téléchargez toutes les réponses des questionnaires</p>
                <button
                  onClick={exportData}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 p-3 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                  style={{backgroundColor: '#1D2945'}}
                >
                  <Download size={16} />
                  <span>{loading ? 'Export en cours...' : 'Télécharger CSV'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Vue par défaut admin
    return (
      <div className="flex h-screen bg-gradient-main">
        <AdminSidebar currentSection="overview" setCurrentSection={setAdminSection} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4" style={{color: '#1D2945'}}>Section en développement</h2>
            <button
              onClick={() => setAdminSection('overview')}
              className="px-6 py-3 text-white rounded-lg"
              style={{backgroundColor: '#1D2945'}}
            >
              Retour à la vue d'ensemble
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vue détail du joueur
  if (currentView === 'player-detail' && selectedPlayer) {
    const stats = playerStats[selectedPlayer.id] || {};
    
    return (
      <div className="min-h-screen p-4 bg-gradient-main">
        <div className="max-w-4xl mx-auto">
          {/* Header avec retour */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentView('players')}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
            >
              <ChevronLeft size={20} />
              <span>Retour</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold" style={{color: '#1D2945'}}>
                {selectedPlayer.name}
              </h1>
              <p className="text-gray-600">Profil joueur</p>
            </div>
            
            <div className="w-20"></div>
          </div>

          {/* Photo et infos principales */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
                {selectedPlayer.photo_url ? (
                  <img 
                    src={selectedPlayer.photo_url} 
                    alt={selectedPlayer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold" style={{background: 'linear-gradient(135deg, #1D2945 0%, #C09D5A 100%)'}}>
                    {selectedPlayer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold mb-4" style={{color: '#1D2945'}}>
                  {selectedPlayer.name}
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total réponses</p>
                    <p className="text-xl font-bold" style={{color: '#1D2945'}}>
                      {stats.total_responses || 0}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Motivation moy.</p>
                    <p className="text-xl font-bold" style={{color: '#22c55e'}}>
                      {stats.avg_motivation || 0}/20
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">RPE moyen</p>
                    <p className="text-xl font-bold" style={{color: '#ef4444'}}>
                      {stats.avg_rpe || 0}/20
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Dernière réponse</p>
                    <p className="text-sm font-bold" style={{color: '#1D2945'}}>
                      {stats.last_response_date || 'Jamais'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <button
              onClick={() => setCurrentView('pre-session')}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{backgroundColor: '#22c55e', opacity: 0.1}}>
                  <Target className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{color: '#1D2945'}}>Questionnaire Pré-Séance</h3>
                  <p className="text-sm text-gray-600">Motivation, fatigue, objectifs</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setCurrentView('post-session')}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{backgroundColor: '#ef4444', opacity: 0.1}}>
                  <Heart className="text-red-500" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{color: '#1D2945'}}>Questionnaire Post-Séance</h3>
                  <p className="text-sm text-gray-600">RPE, technique, tactique</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setCurrentView('stats')}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{backgroundColor: '#1D2945', opacity: 0.1}}>
                  <BarChart3 style={{color: '#1D2945'}} size={24} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{color: '#1D2945'}}>Statistiques</h3>
                  <p className="text-sm text-gray-600">Évolution et analyse</p>
                </div>
              </div>
            </button>
          </div>

          {/* Objectifs personnels */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4" style={{color: '#1D2945'}}>Objectifs personnels</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objectifs de la saison
                </label>
                <textarea
                  value={questionnaireSelf.objectives || selectedPlayer.objectives || ''}
                  onChange={(e) => setQuestionnaireSelf(prev => ({ ...prev, objectives: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-blue-500"
                  rows="3"
                  placeholder="Décrivez vos objectifs pour cette saison..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points d'amélioration
                </label>
                <textarea
                  value={questionnaireSelf.objectifs_individuels || selectedPlayer.objectifs_individuels || ''}
                  onChange={(e) => setQuestionnaireSelf(prev => ({ ...prev, objectifs_individuels: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-blue-500"
                  rows="3"
                  placeholder="Quels aspects souhaitez-vous améliorer ?"
                />
              </div>
              
              <button
                onClick={updateObjectives}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                style={{backgroundColor: '#1D2945'}}
              >
                <Save size={16} />
                <span>{loading ? 'Sauvegarde...' : 'Sauvegarder les objectifs'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vue questionnaire pré-séance
  if (currentView === 'pre-session' && selectedPlayer) {
    return (
      <div className="min-h-screen p-4 bg-gradient-main">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentView('player-detail')}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
            >
              <ChevronLeft size={20} />
              <span>Retour</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold" style={{color: '#1D2945'}}>Pré-Séance</h1>
              <p className="text-gray-600">{selectedPlayer.name}</p>
            </div>
            
            <div className="w-20"></div>
          </div>

          {/* Formulaire */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4" style={{color: '#1D2945'}}>
                Comment vous sentez-vous avant la séance ?
              </h2>
              <p className="text-gray-600">
                Évaluez votre état sur une échelle de 1 à 20
              </p>
            </div>

            <div className="space-y-8">
              <ScaleQuestion
                question="Quel est votre niveau de motivation aujourd'hui ?"
                value={preSessionForm.motivation}
                onChange={(value) => setPreSessionForm(prev => ({ ...prev, motivation: value }))}
                leftLabel="Très faible motivation"
                rightLabel="Motivation maximale"
              />

              <ScaleQuestion
                question="Comment évaluez-vous votre niveau de fatigue ?"
                value={preSessionForm.fatigue}
                onChange={(value) => setPreSessionForm(prev => ({ ...prev, fatigue: value }))}
                leftLabel="Très fatigué(e)"
                rightLabel="Pleine forme"
              />

              <ScaleQuestion
                question="À quel point avez-vous hâte de jouer ?"
                value={preSessionForm.plaisir}
                onChange={(value) => setPreSessionForm(prev => ({ ...prev, plaisir: value }))}
                leftLabel="Pas du tout hâte"
                rightLabel="Très hâte"
              />

              <ScaleQuestion
                question="Comment évaluez-vous la difficulté de vos objectifs pour cette séance ?"
                value={preSessionForm.objectif_difficulte}
                onChange={(value) => setPreSessionForm(prev => ({ ...prev, objectif_difficulte: value }))}
                leftLabel="Objectifs très faciles"
                rightLabel="Objectifs très difficiles"
              />
            </div>

            <div className="mt-8 pt-6 border-t">
              <button
                onClick={() => saveQuestionnaire('pre')}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-4 text-white rounded-lg text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50"
                style={{background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'}}
              >
                <Save size={20} />
                <span>{loading ? 'Sauvegarde en cours...' : 'Enregistrer mes réponses'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vue questionnaire post-séance
  if (currentView === 'post-session' && selectedPlayer) {
    return (
      <div className="min-h-screen p-4 bg-gradient-main">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentView('player-detail')}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
            >
              <ChevronLeft size={20} />
              <span>Retour</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold" style={{color: '#1D2945'}}>Post-Séance</h1>
              <p className="text-gray-600">{selectedPlayer.name}</p>
            </div>
            
            <div className="w-20"></div>
          </div>

          {/* Formulaire */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4" style={{color: '#1D2945'}}>
                Comment s'est passée la séance ?
              </h2>
              <p className="text-gray-600">
                Évaluez la séance sur une échelle de 1 à 20
              </p>
            </div>

            <div className="space-y-8">
              <ScaleQuestion
                question="Dans quelle mesure vos objectifs ont-ils été atteints ?"
                value={postSessionForm.objectifs_repondu}
                onChange={(value) => setPostSessionForm(prev => ({ ...prev, objectifs_repondu: value }))}
                leftLabel="Pas du tout atteints"
                rightLabel="Complètement atteints"
              />

              <ScaleQuestion
                question="Comment évaluez-vous l'intensité de la séance (RPE) ?"
                value={postSessionForm.intensite_rpe}
                onChange={(value) => setPostSessionForm(prev => ({ ...prev, intensite_rpe: value }))}
                leftLabel="Très facile"
                rightLabel="Maximale"
              />

              <ScaleQuestion
                question="Quel plaisir avez-vous pris pendant cette séance ?"
                value={postSessionForm.plaisir_seance}
                onChange={(value) => setPostSessionForm(prev => ({ ...prev, plaisir_seance: value }))}
                leftLabel="Aucun plaisir"
                rightLabel="Plaisir maximal"
              />

              <ScaleQuestion
                question="Comment évaluez-vous le travail tactique ?"
                value={postSessionForm.tactique}
                onChange={(value) => setPostSessionForm(prev => ({ ...prev, tactique: value }))}
                leftLabel="Très insuffisant"
                rightLabel="Excellent"
              />

              <ScaleQuestion
                question="Comment évaluez-vous le travail technique ?"
                value={postSessionForm.technique}
                onChange={(value) => setPostSessionForm(prev => ({ ...prev, technique: value }))}
                leftLabel="Très insuffisant"
                rightLabel="Excellent"
              />

              <ScaleQuestion
                question="Dans quelle mesure avez-vous eu une influence positive sur l'équipe ?"
                value={postSessionForm.influence_positive}
                onChange={(value) => setPostSessionForm(prev => ({ ...prev, influence_positive: value }))}
                leftLabel="Aucune influence"
                rightLabel="Influence maximale"
              />

              <ScaleQuestion
                question="Comment vous sentez-vous par rapport au groupe ?"
                value={postSessionForm.sentiment_groupe}
                onChange={(value) => setPostSessionForm(prev => ({ ...prev, sentiment_groupe: value }))}
                leftLabel="Déconnecté(e)"
                rightLabel="Très connecté(e)"
              />

              {/* Commentaires libres */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Commentaires libres (optionnel)
                </label>
                <textarea
                  value={postSessionForm.commentaires_libres}
                  onChange={(e) => setPostSessionForm(prev => ({ ...prev, commentaires_libres: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-blue-500"
                  rows="4"
                  placeholder="Partagez vos impressions, suggestions ou remarques..."
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <button
                onClick={() => saveQuestionnaire('post')}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-4 text-white rounded-lg text-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50"
                style={{background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}}
              >
                <Save size={20} />
                <span>{loading ? 'Sauvegarde en cours...' : 'Enregistrer mes réponses'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vue statistiques
  if (currentView === 'stats' && selectedPlayer) {
    const preResponses = selectedPlayer.responses?.filter(r => r.type === 'pre') || [];
    const postResponses = selectedPlayer.responses?.filter(r => r.type === 'post') || [];
    
    return (
      <div className="min-h-screen p-4 bg-gradient-main">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentView('player-detail')}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
            >
              <ChevronLeft size={20} />
              <span>Retour</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold" style={{color: '#1D2945'}}>Statistiques</h1>
              <p className="text-gray-600">{selectedPlayer.name}</p>
            </div>
            
            <div className="w-20"></div>
          </div>

          {/* Cartes de statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                <h3 className="text-sm text-gray-600 mb-2">Total séances</h3>
                <p className="text-3xl font-bold" style={{color: '#1D2945'}}>
                  {Math.max(preResponses.length, postResponses.length)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                <h3 className="text-sm text-gray-600 mb-2">Motivation moyenne</h3>
                <p className="text-3xl font-bold" style={{color: '#22c55e'}}>
                  {preResponses.length > 0 
                    ? (preResponses.reduce((sum, r) => sum + (r.data?.motivation || 0), 0) / preResponses.length).toFixed(1)
                    : '0'}/20
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                <h3 className="text-sm text-gray-600 mb-2">RPE moyen</h3>
                <p className="text-3xl font-bold" style={{color: '#ef4444'}}>
                  {postResponses.length > 0 
                    ? (postResponses.reduce((sum, r) => sum + (r.data?.intensite_rpe || 0), 0) / postResponses.length).toFixed(1)
                    : '0'}/20
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                <h3 className="text-sm text-gray-600 mb-2">Plaisir moyen</h3>
                <p className="text-3xl font-bold" style={{color: '#8b5cf6'}}>
                  {postResponses.length > 0 
                    ? (postResponses.reduce((sum, r) => sum + (r.data?.plaisir_seance || 0), 0) / postResponses.length).toFixed(1)
                    : '0'}/20
                </p>
              </div>
            </div>
          </div>

          {/* Graphiques détaillés */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {preResponses.length > 0 && (
              <SimpleChart
                title="Évolution Pré-Séance"
                data={[
                  {
                    label: 'Motivation',
                    value: parseFloat((preResponses.reduce((sum, r) => sum + (r.data?.motivation || 0), 0) / preResponses.length).toFixed(1))
                  },
                  {
                    label: 'Énergie',
                    value: parseFloat((preResponses.reduce((sum, r) => sum + (r.data?.fatigue || 0), 0) / preResponses.length).toFixed(1))
                  },
                  {
                    label: 'Anticipation',
                    value: parseFloat((preResponses.reduce((sum, r) => sum + (r.data?.plaisir || 0), 0) / preResponses.length).toFixed(1))
                  }
                ]}
                color="#22c55e"
              />
            )}

            {postResponses.length > 0 && (
              <SimpleChart
                title="Évolution Post-Séance"
                data={[
                  {
                    label: 'RPE (Intensité)',
                    value: parseFloat((postResponses.reduce((sum, r) => sum + (r.data?.intensite_rpe || 0), 0) / postResponses.length).toFixed(1))
                  },
                  {
                    label: 'Plaisir',
                    value: parseFloat((postResponses.reduce((sum, r) => sum + (r.data?.plaisir_seance || 0), 0) / postResponses.length).toFixed(1))
                  },
                  {
                    label: 'Tactique',
                    value: parseFloat((postResponses.reduce((sum, r) => sum + (r.data?.tactique || 0), 0) / postResponses.length).toFixed(1))
                  },
                  {
                    label: 'Technique',
                    value: parseFloat((postResponses.reduce((sum, r) => sum + (r.data?.technique || 0), 0) / postResponses.length).toFixed(1))
                  }
                ]}
                color="#ef4444"
              />
            )}
          </div>

          {/* Historique des réponses récentes */}
          {selectedPlayer.responses && selectedPlayer.responses.length > 0 && (
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4" style={{color: '#1D2945'}}>
                Historique récent
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Type</th>
                      <th className="text-left py-2">Motivation</th>
                      <th className="text-left py-2">RPE</th>
                      <th className="text-left py-2">Plaisir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPlayer.responses.slice(0, 10).map((response, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2">
                          {new Date(response.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            response.type === 'pre' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {response.type === 'pre' ? 'Pré' : 'Post'}
                          </span>
                        </td>
                        <td className="py-2">
                          {response.data?.motivation || '-'}/20
                        </td>
                        <td className="py-2">
                          {response.data?.intensite_rpe || '-'}/20
                        </td>
                        <td className="py-2">
                          {response.data?.plaisir || response.data?.plaisir_seance || '-'}/20
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Message si pas de données */}
          {(!selectedPlayer.responses || selectedPlayer.responses.length === 0) && (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <BarChart3 className="mx-auto mb-4" style={{color: '#1D2945'}} size={48} />
              <h3 className="text-xl font-semibold mb-2" style={{color: '#1D2945'}}>
                Aucune donnée disponible
              </h3>
              <p className="text-gray-600 mb-6">
                {selectedPlayer.name} n'a pas encore rempli de questionnaire.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setCurrentView('pre-session')}
                  className="px-6 py-3 text-white rounded-lg hover:shadow-lg transition-all"
                  style={{backgroundColor: '#22c55e'}}
                >
                  Premier questionnaire pré-séance
                </button>
              </div>
            </div>
          )}
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
            <div className="text-white text-2xl font-bold">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="none" stroke="white" strokeWidth="2"/>
                <path d="M16 8L20 12H18V20H14V12H12L16 8Z" fill="white"/>
                <circle cx="16" cy="24" r="1.5" fill="white"/>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{color: '#1D2945'}}>Équipe Futsal Féminine</h1>
          <p className="text-gray-600">Nantes Métropole Futsal</p>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  if (!isAdmin) {
                    const pwd = prompt('Mot de passe entraîneur :');
                    if (pwd === 'coachNmf_2026') {
                      setIsAdmin(true);
                      setForceUpdate(prev => prev + 1); // Force re-render
                      alert('Mode entraîneur activé');
                    } else if (pwd) {
                      alert('Mot de passe incorrect');
                    }
                  } else {
                    setIsAdmin(false);
                    setForceUpdate(prev => prev + 1); // Force re-render
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  !isAdmin 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'text-white shadow-md'
                }`}
                style={isAdmin ? {backgroundColor: '#1D2945'} : {}}
              >
                {!isAdmin ? 'Mode Entraîneur' : 'Mode Entraîneur ✓'}
              </button>
              
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-all"
              >
                Déconnexion
              </button>
              
              {/* Indicateur de debug temporaire */}
              <span className="px-2 py-1 bg-yellow-200 text-black text-xs rounded">
                Admin: {isAdmin ? 'ON' : 'OFF'} | Update: {forceUpdate}
              </span>
            </div>
            
            {/* Version encore plus simple - toujours affichés quand isAdmin est true */}
            <div className="flex space-x-2">
              {isAdmin ? (
                <>
                  <button
                    onClick={() => setCurrentView('admin')}
                    className="text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 shadow-md hover:shadow-lg transition-all"
                    style={{backgroundColor: '#1D2945'}}
                  >
                    <Settings size={16} />
                    <span>Administration</span>
                  </button>
                  
                  <button
                    onClick={addNewPlayer}
                    disabled={loading}
                    className="text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    style={{backgroundColor: '#C09D5A'}}
                  >
                    <UserPlus size={16} />
                    <span>Ajouter</span>
                  </button>
                </>
              ) : (
                <div className="px-4 py-2 text-gray-400 text-sm">
                  Mode utilisateur
                </div>
              )}
            </div>
          </div>
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
              />
            ))}
          </div>
        </div>

        <style jsx>{`
          .bg-gradient-main {
            background: linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%);
          }
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            height: 24px;
            width: 24px;
            border-radius: 50%;
            background: linear-gradient(45deg, #1D2945, #C09D5A);
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
            border: 2px solid white;
          }
          input[type="range"]::-moz-range-thumb {
            height: 24px;
            width: 24px;
            border-radius: 50%;
            background: linear-gradient(45deg, #1D2945, #C09D5A);
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
            border: none;
          }
        `}</style>
      </div>
    );
  }

  // Retour par défaut si aucune vue n'est trouvée
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-main">
      <div className="text-center">
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
