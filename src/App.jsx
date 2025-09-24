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

    // Gestion des joueuses
    if (adminSection === 'players-admin') {
      return (
        <div className="flex h-screen bg-gradient-main">
          <AdminSidebar currentSection={adminSection} setCurrentSection={setAdminSection} />
          <div className="flex-1 p-8 overflow-auto">
            <header className="mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold" style={{color: '#1D2945'}}>Gestion des joueuses</h1>
                  <p className="text-gray-600">Administration et statistiques des joueuses</p>
                </div>
                <button
                  onClick={addNewPlayer}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  style={{backgroundColor: '#C09D5A'}}
                >
                  <UserPlus size={16} />
                  <span>Ajouter une joueuse</span>
                </button>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {players.map(player => {
                const stats = playerStats[player.id] || {};
                return (
                  <div key={player.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                        {player.photo_url ? (
                          <img 
                            src={player.photo_url} 
                            alt={player.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold" style={{background: 'linear-gradient(135deg, #1D2945 0%, #C09D5A 100%)'}}>
                            {player.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold" style={{color: '#1D2945'}}>{player.name}</h3>
                        <p className="text-sm text-gray-600">
                          {stats.total_responses || 0} réponses
                        </p>
                        {stats.last_response_date && (
                          <p className="text-xs text-gray-500">
                            Dernière: {stats.last_response_date}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Motivation moy.</span>
                        <span className="font-medium">{stats.avg_motivation || 0}/20</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Fatigue moy.</span>
                        <span className="font-medium">{stats.avg_fatigue || 0}/20</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">RPE moy.</span>
                        <span className="font-medium">{stats.avg_rpe || 0}/20</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPlayer(player);
                          setCurrentView('player-detail');
                        }}
                        className="flex-1 flex items-center justify-center space-x-1 p-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-all"
                      >
                        <Eye size={14} />
                        <span>Voir</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPlayer(player);
                          setQuestionnaireSelf({ 
                            objectives: player.objectives,
                            objectifs_individuels: player.objectifs_individuels 
                          });
                          setCurrentView('player-detail');
                        }}
                        className="flex-1 flex items-center justify-center space-x-1 p-2 text-white rounded-lg text-sm hover:shadow-lg transition-all"
                        style={{backgroundColor: '#1D2945'}}
                      >
                        <Edit3 size={14} />
                        <span>Modifier</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Analytiques avancées
    if (adminSection === 'analytics') {
      const motivationData = players.map(p => ({
        name: p.name,
        data: p.responses?.filter(r => r.type === 'pre')
          .slice(-10)
          .map(r => ({
            date: new Date(r.created_at).toLocaleDateString('fr-FR'),
            value: r.data?.motivation || 0
          })) || []
      })).filter(p => p.data.length > 0);

      return (
        <div className="flex h-screen bg-gradient-main">
          <AdminSidebar currentSection={adminSection} setCurrentSection={setAdminSection} />
          <div className="flex-1 p-8 overflow-auto">
            <header className="mb-8">
              <h1 className="text-3xl font-bold" style={{color: '#1D2945'}}>Analytiques avancées</h1>
              <p className="text-gray-600">Évolution et tendances détaillées</p>
            </header>

            {/* Moyennes d'équipe */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-2" style={{color: '#1D2945'}}>Motivation équipe</h3>
                <p className="text-3xl font-bold" style={{color: '#22c55e'}}>
                  {(players.reduce((sum, p) => sum + parseFloat(playerStats[p.id]?.avg_motivation || 0), 0) / Math.max(1, players.filter(p => playerStats[p.id]?.avg_motivation > 0).length)).toFixed(1)}/20
                </p>
                <p className="text-sm text-gray-600">Moyenne générale</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-2" style={{color: '#1D2945'}}>Fatigue équipe</h3>
                <p className="text-3xl font-bold" style={{color: '#f59e0b'}}>
                  {(players.reduce((sum, p) => sum + parseFloat(playerStats[p.id]?.avg_fatigue || 0), 0) / Math.max(1, players.filter(p => playerStats[p.id]?.avg_fatigue > 0).length)).toFixed(1)}/20
                </p>
                <p className="text-sm text-gray-600">Moyenne générale</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-2" style={{color: '#1D2945'}}>RPE équipe</h3>
                <p className="text-3xl font-bold" style={{color: '#ef4444'}}>
                  {(players.reduce((sum, p) => sum + parseFloat(playerStats[p.id]?.avg_rpe || 0), 0) / Math.max(1, players.filter(p => playerStats[p.id]?.avg_rpe > 0).length)).toFixed(1)}/20
                </p>
                <p className="text-sm text-gray-600">Moyenne générale</p>
              </div>
            </div>

            {/* Graphiques détaillés */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SimpleChart
                title="Top 5 - Motivation"
                data={players
                  .map(p => ({
                    label: p.name,
                    value: parseFloat(playerStats[p.id]?.avg_motivation || 0)
                  }))
                  .filter(d => d.value > 0)
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 5)}
                color="#22c55e"
              />

              <SimpleChart
                title="Top 5 - Activité (réponses)"
                data={players
                  .map(p => ({
                    label: p.name,
                    value: playerStats[p.id]?.total_responses || 0
                  }))
                  .filter(d => d.value > 0)
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 5)}
                color="#1D2945"
              />

              <SimpleChart
                title="Fatigue moyenne"
                data={players
                  .map(p => ({
                    label: p.name,
                    value: parseFloat(playerStats[p.id]?.avg_fatigue || 0)
                  }))
                  .filter(d => d.value > 0)
                  .slice(0, 6)}
                color="#f59e0b"
              />

              <SimpleChart
                title="RPE moyen"
                data={players
                  .map(p => ({
                    label: p.name,
                    value: parseFloat(playerStats[p.id]?.avg_rpe || 0)
                  }))
                  .filter(d => d.value > 0)
                  .slice(0, 6)}
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
                <p className="text-gray-600 mb-4">Téléchargez toutes les réponses des questionnaires en format CSV pour analyse dans Excel</p>
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <p>• Toutes les réponses avec dates</p>
                  <p>• Données par joueuse</p>
                  <p>• Questionnaires pré et post séance</p>
                  <p>• Commentaires libres inclus</p>
                </div>
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

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4" style={{color: '#1D2945'}}>Statistiques résumées</h3>
                <p className="text-gray-600 mb-4">Export des moyennes et statistiques par joueuse</p>
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <p>• Moyennes par joueuse</p>
                  <p>• Nombre de réponses</p>
                  <p>• Évolution temporelle</p>
                  <p>• Indicateurs de performance</p>
                </div>
                <button
                  onClick={() => {
                    // Export des statistiques
                    const statsData = players.map(p => ({
                      nom: p.name,
                      total_reponses: playerStats[p.id]?.total_responses || 0,
                      avg_motivation: playerStats[p.id]?.avg_motivation || 0,
                      avg_fatigue: playerStats[p.id]?.avg_fatigue || 0,
                      avg_rpe: playerStats[p.id]?.avg_rpe || 0,
                      derniere_reponse: playerStats[p.id]?.last_response_date || 'Aucune'
                    }));

                    const csvContent = [
                      ['Nom', 'Total réponses', 'Motivation moy.', 'Fatigue moy.', 'RPE moy.', 'Dernière réponse'].join(','),
                      ...statsData.map(row => [
                        `"${row.nom}"`,
                        row.total_reponses,
                        row.avg_motivation,
                        row.avg_fatigue,
                        row.avg_rpe,
                        `"${row.derniere_reponse}"`
                      ].join(','))
                    ].join('\n');

                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `stats-futsal-${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  }}
                  className="w-full flex items-center justify-center space-x-2 p-3 text-white rounded-lg hover:shadow-lg transition-all"
                  style={{backgroundColor: '#C09D5A'}}
                >
                  <BarChart3 size={16} />
                  <span>Télécharger stats</span>
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 md:col-span-2">
                <h3 className="text-lg font-semibold mb-4" style={{color: '#1D2945'}}>Informations export</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-2">Données disponibles:</p>
                    <ul className="text-gray-600 space-y-1">
                      <li>• {players.length} joueuses</li>
                      <li>• {players.reduce((sum, p) => sum + (p.responses?.length || 0), 0)} réponses totales</li>
                      <li>• Période: {new Date().getFullYear()}</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Format CSV compatible:</p>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Microsoft Excel</li>
                      <li>• Google Sheets</li>
                      <li>• LibreOffice Calc</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Encodage:</p>
                    <ul className="text-gray-600 space-y-1">
                      <li>• UTF-8 avec BOM</li>
                      <li>• Caractères français</li>
                      <li>• Séparateur: virgule</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Vue par défaut admin - retour à overview
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
  }import React, { useState, useEffect } from 'react';
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
              {!isAdmin ? (
                <button
                  onClick={() => {
                    const pwd = prompt('Mot de passe entraîneur :');
                    if (pwd === 'coachNmf_2026') {
                      setIsAdmin(true);
                      alert('Mode entraîneur activé');
                    } else if (pwd) {
                      alert('Mot de passe incorrect');
                    }
                  }}
                  className="px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                >
                  Mode Entraîneur
                </button>
              ) : (
                <button
                  onClick={() => setIsAdmin(false)}
                  className="px-4 py-2 rounded-lg font-medium text-white shadow-md transition-all"
                  style={{backgroundColor: '#1D2945'}}
                >
                  Mode Entraîneur ✓
                </button>
              )}
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-all"
              >
                Déconnexion
              </button>
            </div>
            {isAdmin && (
              <button
                onClick={addNewPlayer}
                disabled={loading}
                className="text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                style={{backgroundColor: '#C09D5A'}}
              >
                <UserPlus size={16} />
                <span>Ajouter</span>
              </button>
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
              />
            ))}
          </div>
        </div>

        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 24px;
            width: 24px;
            border-radius: 50%;
            background: linear-gradient(45deg, #1D2945, #C09D5A);
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
            border: 2px solid white;
          }
          .slider::-moz-range-thumb {
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

  // Détail joueur avec objectifs
  if (currentView === 'player-detail') {
    return (
      <div className="min-h-screen p-4" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
        <div className="max-w-2xl mx-auto">
          <header className="flex items-center mb-6">
            <button 
              onClick={() => setCurrentView('players')}
              className="mr-4 p-2 rounded-full bg-white shadow-md hover:shadow-lg"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{background: 'linear-gradient(135deg, #1D2945 0%, #C09D5A 100%)'}}>
                {selectedPlayer?.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{color: '#1D2945'}}>{selectedPlayer?.name}</h2>
                <p className="text-gray-600">Questionnaires et objectifs</p>
              </div>
            </div>
          </header>

          {isAdmin && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center" style={{color: '#1D2945'}}>
                <Target className="mr-2" style={{color: '#C09D5A'}} />
                Objectifs pour {selectedPlayer?.name} (Coach)
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Objectifs collectifs/généraux :
                </label>
                <textarea
                  value={questionnaireSelf.objectives !== undefined ? questionnaireSelf.objectives : (selectedPlayer?.objectives || '')}
                  onChange={(e) => setQuestionnaireSelf({...questionnaireSelf, objectives: e.target.value})}
                  placeholder="Objectifs généraux et collectifs pour cette joueuse..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20 focus:ring-2 focus:border-transparent focus:ring-yellow-400"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Objectifs individuels spécifiques :
                </label>
                <textarea
                  value={questionnaireSelf.objectifs_individuels !== undefined ? questionnaireSelf.objectifs_individuels : (selectedPlayer?.objectifs_individuels || '')}
                  onChange={(e) => setQuestionnaireSelf({...questionnaireSelf, objectifs_individuels: e.target.value})}
                  placeholder="Objectifs personnels et techniques spécifiques pour cette séance..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20 focus:ring-2 focus:border-transparent focus:ring-yellow-400"
                />
              </div>

              <button
                onClick={updateObjectives}
                disabled={loading}
                className="text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                style={{backgroundColor: '#1D2945'}}
              >
                <Save size={16} className="mr-2" />
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={() => setCurrentView('pre-session')}
              className="w-full text-white p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              style={{background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'}}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-lg font-semibold">Questionnaire Pré-Séance</h3>
                  <p className="opacity-90">Motivation, fatigue, plaisir anticipé</p>
                </div>
                <ChevronRight size={24} />
              </div>
            </button>

            <button
              onClick={() => setCurrentView('post-session')}
              className="w-full text-white p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              style={{background: 'linear-gradient(135deg, #1D2945 0%, #2563eb 100%)'}}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-lg font-semibold">Questionnaire Post-Séance</h3>
                  <p className="opacity-90">Bilan de la séance et ressenti</p>
                </div>
                <ChevronRight size={24} />
              </div>
            </button>

            <button
              onClick={() => setCurrentView('stats')}
              className="w-full text-white p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              style={{background: 'linear-gradient(135deg, #C09D5A 0%, #b8860b 100%)'}}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-lg font-semibold">Historique & Statistiques</h3>
                  <p className="opacity-90">Voir l'évolution des réponses</p>
                </div>
                <BarChart3 size={24} />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Questionnaire pré-séance
  if (currentView === 'pre-session') {
    return (
      <div className="min-h-screen p-4" style={{background: 'linear-gradient(135deg, #f0fdf4 0%, #fef9e7 100%)'}}>
        <div className="max-w-2xl mx-auto">
          <header className="flex items-center mb-6">
            <button 
              onClick={() => setCurrentView('player-detail')}
              className="mr-4 p-2 rounded-full bg-white shadow-md hover:shadow-lg"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold" style={{color: '#1D2945'}}>Questionnaire Pré-Séance</h2>
              <p className="text-gray-600">{selectedPlayer?.name}</p>
            </div>
          </header>

          {(selectedPlayer?.objectives || selectedPlayer?.objectifs_individuels) && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4" style={{borderLeftColor: '#C09D5A'}}>
              {selectedPlayer.objectives && (
                <>
                  <h3 className="font-semibold mb-2" style={{color: '#1D2945'}}>🎯 Objectifs généraux :</h3>
                  <p className="text-gray-700 mb-3">{selectedPlayer.objectives}</p>
                </>
              )}
              {selectedPlayer.objectifs_individuels && (
                <>
                  <h3 className="font-semibold mb-2" style={{color: '#1D2945'}}>⭐ Tes objectifs individuels :</h3>
                  <p className="text-gray-700">{selectedPlayer.objectifs_individuels}</p>
                </>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6">
            <ScaleQuestion
              question="💪 Quel est ton niveau de motivation aujourd'hui ?"
              value={preSessionForm.motivation}
              onChange={(value) => setPreSessionForm({...preSessionForm, motivation: value})}
              leftLabel="Pas motivé"
              rightLabel="Très motivé"
            />

            <ScaleQuestion
              question="😴 Quel est ton niveau de fatigue dû à ta journée de travail ?"
              value={preSessionForm.fatigue}
              onChange={(value) => setPreSessionForm({...preSessionForm, fatigue: value})}
              leftLabel="Pas fatigué"
              rightLabel="Très fatigué"
            />

            <ScaleQuestion
              question="😊 Quel est ton niveau de plaisir à venir à cette séance ?"
              value={preSessionForm.plaisir}
              onChange={(value) => setPreSessionForm({...preSessionForm, plaisir: value})}
              leftLabel="Aucun plaisir"
              rightLabel="Très hâte"
            />

            <ScaleQuestion
              question="🎯 Quelle difficulté ressens-tu face à ton objectif personnel ?"
              value={preSessionForm.objectif_difficulte}
              onChange={(value) => setPreSessionForm({...preSessionForm, objectif_difficulte: value})}
              leftLabel="Très facile"
              rightLabel="Très difficile"
            />

            <button
              onClick={() => saveQuestionnaire('pre')}
              disabled={loading}
              className="w-full text-white py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50"
              style={{background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'}}
            >
              {loading ? 'Sauvegarde...' : 'Valider le questionnaire'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Questionnaire post-séance
  if (currentView === 'post-session') {
    return (
      <div className="min-h-screen p-4" style={{background: 'linear-gradient(135deg, #eff6ff 0%, #fef9e7 100%)'}}>
        <div className="max-w-2xl mx-auto">
          <header className="flex items-center mb-6">
            <button 
              onClick={() => setCurrentView('player-detail')}
              className="mr-4 p-2 rounded-full bg-white shadow-md hover:shadow-lg"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold" style={{color: '#1D2945'}}>Questionnaire Post-Séance</h2>
              <p className="text-gray-600">{selectedPlayer?.name}</p>
            </div>
          </header>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <ScaleQuestion
              question="✅ As-tu pu répondre aux objectifs proposés ?"
              value={postSessionForm.objectifs_repondu}
              onChange={(value) => setPostSessionForm({...postSessionForm, objectifs_repondu: value})}
              leftLabel="Pas du tout"
              rightLabel="Complètement"
            />

            <ScaleQuestion
              question="🔥 Quelle a été l'intensité de la séance (RPE) ?"
              value={postSessionForm.intensite_rpe}
              onChange={(value) => setPostSessionForm({...postSessionForm, intensite_rpe: value})}
              leftLabel="Très facile"
              rightLabel="Très difficile"
            />

            <ScaleQuestion
              question="😊 Quel plaisir as-tu pris pendant la séance ?"
              value={postSessionForm.plaisir_seance}
              onChange={(value) => setPostSessionForm({...postSessionForm, plaisir_seance: value})}
              leftLabel="Aucun plaisir"
              rightLabel="Énormément"
            />

            <ScaleQuestion
              question="🧠 Comment t'es-tu sentie tactiquement ?"
              value={postSessionForm.tactique}
              onChange={(value) => setPostSessionForm({...postSessionForm, tactique: value})}
              leftLabel="Très mal"
              rightLabel="Très bien"
            />

            <ScaleQuestion
              question="⚽ Comment t'es-tu sentie techniquement ?"
              value={postSessionForm.technique}
              onChange={(value) => setPostSessionForm({...postSessionForm, technique: value})}
              leftLabel="Très mal"
              rightLabel="Très bien"
            />

            <ScaleQuestion
              question="🤝 Comment penses-tu avoir influencé positivement tes coéquipières ?"
              value={postSessionForm.influence_positive}
              onChange={(value) => setPostSessionForm({...postSessionForm, influence_positive: value})}
              leftLabel="Pas du tout"
              rightLabel="Énormément"
            />

            <ScaleQuestion
              question="👥 Comment t'es-tu sentie dans le groupe ?"
              value={postSessionForm.sentiment_groupe}
              onChange={(value) => setPostSessionForm({...postSessionForm, sentiment_groupe: value})}
              leftLabel="Très mal"
              rightLabel="Très bien"
            />

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                💭 Tes commentaires libres sur la séance :
              </label>
              <textarea
                value={postSessionForm.commentaires_libres}
                onChange={(e) => setPostSessionForm({...postSessionForm, commentaires_libres: e.target.value})}
                placeholder="Exprime-toi librement sur cette séance : ressenti, points positifs, difficultés, suggestions..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:border-transparent focus:ring-blue-400 text-sm"
              />
            </div>

            <button
              onClick={() => saveQuestionnaire('post')}
              disabled={loading}
              className="w-full text-white py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50"
              style={{background: 'linear-gradient(135deg, #1D2945 0%, #2563eb 100%)'}}
            >
              {loading ? 'Sauvegarde...' : 'Valider le questionnaire'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Historique et statistiques
  if (currentView === 'stats') {
    const playerResponses = selectedPlayer?.responses || [];
    const preResponses = playerResponses.filter(r => r.type === 'pre');
    const postResponses = playerResponses.filter(r => r.type === 'post');

    return (
      <div className="min-h-screen p-4" style={{background: 'linear-gradient(135deg, #fffbeb 0%, #fef9e7 100%)'}}>
        <div className="max-w-2xl mx-auto">
          <header className="flex items-center mb-6">
            <button 
              onClick={() => setCurrentView('player-detail')}
              className="mr-4 p-2 rounded-full bg-white shadow-md hover:shadow-lg"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold" style={{color: '#1D2945'}}>Historique & Statistiques</h2>
              <p className="text-gray-600">{selectedPlayer?.name}</p>
            </div>
          </header>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center" style={{color: '#1D2945'}}>
                <BarChart3 className="mr-2" style={{color: '#22c55e'}} />
                Questionnaires Pré-Séance ({preResponses.length})
              </h3>
              {preResponses.length > 0 ? (
                <div className="space-y-2">
                  {preResponses.slice(-5).map((response, index) => (
                    <div key={index} className="p-3 rounded-lg" style={{backgroundColor: '#f0fdf4'}}>
                      <div className="text-sm text-gray-600 mb-1">
                        {new Date(response.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <span>Motivation: {response.data.motivation}/20</span>
                        <span>Fatigue: {response.data.fatigue}/20</span>
                        <span>Plaisir: {response.data.plaisir}/20</span>
                        <span>Difficulté obj.: {response.data.objectif_difficulte}/20</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Aucune donnée disponible</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center" style={{color: '#1D2945'}}>
                <Heart className="mr-2" style={{color: '#1D2945'}} />
                Questionnaires Post-Séance ({postResponses.length})
              </h3>
              {postResponses.length > 0 ? (
                <div className="space-y-2">
                  {postResponses.slice(-5).map((response, index) => (
                    <div key={index} className="p-3 rounded-lg" style={{backgroundColor: '#eff6ff'}}>
                      <div className="text-sm text-gray-600 mb-1">
                        {new Date(response.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <span>Objectifs: {response.data.objectifs_repondu}/20</span>
                        <span>RPE: {response.data.intensite_rpe}/20</span>
                        <span>Plaisir: {response.data.plaisir_seance}/20</span>
                        <span>Tactique: {response.data.tactique}/20</span>
                        <span>Technique: {response.data.technique}/20</span>
                        <span>Influence+: {response.data.influence_positive}/20</span>
                      </div>
                      {response.data.commentaires_libres && (
                        <div className="text-xs mt-2" style={{color: '#1D2945'}}>
                          <span className="font-medium">Commentaires:</span>
                          <div className="text-gray-600 italic mt-1">{response.data.commentaires_libres}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Aucune donnée disponible</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vue par défaut
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4" style={{color: '#1D2945'}}>
          Chargement...
        </h2>
        <button
          onClick={() => setCurrentView('players')}
          className="text-white px-6 py-3 rounded-lg font-semibold"
          style={{backgroundColor: '#1D2945'}}
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
};

export default FutsalApp;
