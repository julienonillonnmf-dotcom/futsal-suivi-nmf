// App.jsx - Version de diagnostic pour éliminer la boucle infinie
import React, { useState, useEffect, useCallback } from 'react';
import { Lock, EyeOff, Eye, Settings, LogOut } from 'lucide-react';
import { supabase } from './supabaseClient';

// Imports directs pour TOUS les composants
import PlayerGrid from './components/PlayerGrid';
import AdminPanel from './views/AdminPanel';
import PlayerDetail from './views/PlayerDetail';
import AdminPlayerDetail from './views/AdminPlayerDetail';
import PreSessionQuestionnaire from './views/PreSessionQuestionnaire';
import PostSessionQuestionnaire from './views/PostSessionQuestionnaire';
import MatchQuestionnaire from './views/MatchQuestionnaire';
import InjuryFollowupQuestionnaire from './views/InjuryFollowupQuestionnaire';

// Composant d'erreur
const ErrorFallback = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
    <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h2 className="text-2xl font-bold mb-4" style={{color: '#1D2945'}}>
        Erreur de chargement
      </h2>
      <p className="text-gray-600 mb-6">
        {error?.message || "Une erreur s'est produite lors du chargement de l'application."}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-3 text-white rounded-lg hover:shadow-lg transition-all"
        style={{backgroundColor: '#1D2945'}}
      >
        Réessayer
      </button>
    </div>
  </div>
);

const App = () => {
  // États principaux
  const [currentView, setCurrentView] = useState('login');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Données - initialisées avec des valeurs par défaut sûres
  const [players, setPlayers] = useState([]);
  const [playerStats, setPlayerStats] = useState({});
  const [objectifsCollectifs, setObjectifsCollectifs] = useState('');
  const [objectifsIndividuels, setObjectifsIndividuels] = useState({});
  const [objectifsMentaux, setObjectifsMentaux] = useState({});
  
  // État pour empêcher les chargements multiples
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);

  // Configuration
  const trainingDays = [1, 2, 4]; // Lundi, Mardi, Jeudi
  const SITE_PASSWORD = 'NMF2026';
  const ADMIN_PASSWORD = 'coachNmf_2026';

  // Fonctions utilitaires SANS useCallback pour éviter les dépendances instables
  const isTodayTrainingDay = () => {
    const today = new Date().getDay();
    return trainingDays.includes(today);
  };

  const hasAnsweredToday = (player) => {
    if (!player?.responses) return false;
    const today = new Date().toDateString();
    return player.responses.some(response => 
      new Date(response.created_at).toDateString() === today
    );
  };

  // Mode admin SANS useCallback
  const toggleAdminMode = () => {
    if (!isAdmin) {
      const pwd = prompt('Mot de passe entraîneur :');
      if (pwd === ADMIN_PASSWORD) {
        setIsAdmin(true);
        alert('Mode entraîneur activé');
      } else if (pwd) {
        alert('Mot de passe incorrect');
      }
    } else {
      setIsAdmin(false);
      if (currentView === 'admin' || currentView === 'admin-player-detail') {
        setCurrentView('players');
      }
    }
  };

  // Statistiques SANS useCallback
  const loadPlayerStatistics = (playersData) => {
    try {
      const stats = {};
      playersData.forEach(player => {
        if (!player.responses) return;
        
        const preResponses = player.responses.filter(r => r.type === 'pre') || [];
        const postResponses = player.responses.filter(r => r.type === 'post') || [];
        const matchResponses = player.responses.filter(r => r.type === 'match') || [];
        
        const chartData = player.responses.map(response => ({
          date: new Date(response.created_at).toLocaleDateString('fr-FR'),
          ...response.data,
          type: response.type
        })) || [];

        stats[player.id] = {
          total_responses: player.responses.length,
          pre_session_responses: preResponses.length,
          post_session_responses: postResponses.length,
          match_responses: matchResponses.length,
          avg_motivation: preResponses.length > 0 
            ? (preResponses.reduce((sum, r) => sum + (r.data?.motivation || 0), 0) / preResponses.length).toFixed(1)
            : 0,
          avg_fatigue: preResponses.length > 0
            ? (preResponses.reduce((sum, r) => sum + (r.data?.fatigue || 0), 0) / preResponses.length).toFixed(1)
            : 0,
          avg_rpe: postResponses.length > 0
            ? (postResponses.reduce((sum, r) => sum + (r.data?.intensite_rpe || 0), 0) / postResponses.length).toFixed(1)
            : 0,
          last_response_date: player.responses.length > 0 
            ? new Date(Math.max(...player.responses.map(r => new Date(r.created_at)))).toLocaleDateString('fr-FR')
            : null,
          chartData: chartData
        };
      });
      setPlayerStats(stats);
    } catch (error) {
      console.error('Erreur calcul statistiques:', error);
      setPlayerStats({});
    }
  };

  // Chargement des objectifs SIMPLIFIÉ - pas de useCallback
  const loadObjectifs = async () => {
    try {
      console.log('📋 Chargement objectifs...');
      
      // Objectifs collectifs - non-critique
      try {
        const { data: collectifs } = await supabase
          .from('team_settings')
          .select('value')
          .eq('key', 'objectifs_collectifs')
          .maybeSingle();
        
        setObjectifsCollectifs(collectifs?.value || '');
      } catch (error) {
        console.log('Objectifs collectifs échoués (non-critique):', error);
        setObjectifsCollectifs('');
      }

      // Objectifs individuels - non-critique
      try {
        const { data: individuels } = await supabase
          .from('players')
          .select('id, objectifs_individuels, objectifs_mentaux')
          .eq('is_active', true);

        if (individuels) {
          const objIndiv = {};
          const objMentaux = {};
          individuels.forEach(player => {
            objIndiv[player.id] = (player.objectifs_individuels && player.objectifs_individuels !== 'EMPTY') ? player.objectifs_individuels : '';
            objMentaux[player.id] = (player.objectifs_mentaux && player.objectifs_mentaux !== 'EMPTY') ? player.objectifs_mentaux : '';
          });
          setObjectifsIndividuels(objIndiv);
          setObjectifsMentaux(objMentaux);
        } else {
          setObjectifsIndividuels({});
          setObjectifsMentaux({});
        }
      } catch (error) {
        console.log('Objectifs individuels échoués (non-critique):', error);
        setObjectifsIndividuels({});
        setObjectifsMentaux({});
      }

    } catch (error) {
      console.log('Erreur générale objectifs (non-critique):', error);
      setObjectifsCollectifs('');
      setObjectifsIndividuels({});
      setObjectifsMentaux({});
    }
  };

  // Chargement des joueurs SIMPLIFIÉ - protection contre les appels multiples
  const loadPlayers = async () => {
    // Protection contre les appels multiples simultanés
    if (isLoadingPlayers) {
      console.log('⚠️ loadPlayers déjà en cours, ignoré');
      return;
    }

    console.log('🔄 Début loadPlayers à:', new Date().toLocaleTimeString());
    setIsLoadingPlayers(true);
    setLoading(true);
    setError(null);

    try {
      // Charger les joueurs
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('Erreur requête players:', error);
        throw error;
      }

      console.log(`✅ ${data.length} joueurs chargés`);
      
      // Charger les réponses - UNE SEULE FOIS par joueur
      const playersWithResponses = await Promise.all(
        data.map(async (player) => {
          try {
            const { data: responses, error: respError } = await supabase
              .from('responses')
              .select('*')
              .eq('player_id', player.id)
              .order('created_at', { ascending: false });
            
            if (respError) {
              console.warn(`Réponses échouées pour ${player.name}:`, respError);
              return { ...player, responses: [] };
            }
            
            return { ...player, responses: responses || [] };
          } catch (playerError) {
            console.warn(`Erreur joueur ${player.name}:`, playerError);
            return { ...player, responses: [] };
          }
        })
      );
      
      console.log('✅ Réponses chargées pour tous les joueurs');
      
      // Mettre à jour les états
      setPlayers(playersWithResponses);
      loadPlayerStatistics(playersWithResponses);
      
      // Charger les objectifs - SANS ATTENDRE (async)
      loadObjectifs().catch(error => {
        console.log('Objectifs échoués (non-bloquant):', error);
      });
      
    } catch (error) {
      console.error('❌ Erreur critique loadPlayers:', error);
      setError(error);
      setPlayers([]);
      setPlayerStats({});
    } finally {
      setLoading(false);
      setIsLoadingPlayers(false);
      console.log('🏁 Fin loadPlayers à:', new Date().toLocaleTimeString());
    }
  };

  // useEffect SIMPLIFIÉ - chargement unique
  useEffect(() => {
    console.log('⚡ useEffect déclenché - isAuthenticated:', isAuthenticated);
    if (isAuthenticated && !isLoadingPlayers && players.length === 0) {
      loadPlayers();
    }
  }, [isAuthenticated]); // UNIQUEMENT isAuthenticated comme dépendance

  // Authentification
  const handleSiteLogin = () => {
    if (loading) return; // Empêcher les soumissions multiples
    
    if (password === SITE_PASSWORD) {
      setIsAuthenticated(true);
      setCurrentView('players');
      setPassword('');
      setError(null);
    } else {
      alert('Mot de passe incorrect');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setCurrentView('login');
    setSelectedPlayer(null);
    setPlayers([]);
    setPlayerStats({});
    setObjectifsCollectifs('');
    setObjectifsIndividuels({});
    setObjectifsMentaux({});
    setError(null);
    setIsLoadingPlayers(false);
  };

  // Gestionnaire d'erreur pour retry
  const handleRetry = () => {
    setError(null);
    setIsLoadingPlayers(false);
    if (isAuthenticated) {
      loadPlayers();
    } else {
      window.location.reload();
    }
  };

  // Props communes pour les composants
  const commonProps = {
    players,
    setPlayers,
    selectedPlayer,
    setSelectedPlayer,
    currentView,
    setCurrentView,
    loading,
    setLoading,
    playerStats,
    isAdmin,
    objectifsCollectifs,
    setObjectifsCollectifs,
    objectifsIndividuels,
    setObjectifsIndividuels,
    objectifsMentaux,
    setObjectifsMentaux,
    loadPlayers,
    supabase,
    isTodayTrainingDay,
    hasAnsweredToday,
    error,
    setError
  };

  // Si erreur critique
  if (error && !isAuthenticated) {
    return <ErrorFallback error={error} onRetry={handleRetry} />;
  }

  // Écran de connexion avec form pour éviter les avertissements DOM
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 bg-white shadow-lg border-2 border-gray-100">
              <img 
                src="/Logo NMF Rose.png" 
                alt="Nantes Métropole Futsal" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{color: '#1D2945'}}>Suivi Équipe Futsal</h1>
            <p className="text-gray-600">Nantes Métropole Futsal</p>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); handleSiteLogin(); }}>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mot de passe d'accès
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                  style={{focusRingColor: '#1D2945'}}
                  placeholder="Entrez le mot de passe"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={!password || loading}
              className="w-full text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{background: 'linear-gradient(135deg, #1D2945 0%, #2563eb 100%)'}}
            >
              {loading ? 'Connexion...' : 'Accéder à l\'application'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Accès réservé aux membres de l'équipe</p>
            <p>Nantes Métropole Futsal</p>
          </div>
        </div>
      </div>
    );
  }

  // Header commun pour les vues authentifiées
  const AppHeader = ({ title, showAdminToggle = false }) => (
    <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold" style={{color: '#1D2945'}}>{title}</h1>
        <div className="flex items-center space-x-2">
          {showAdminToggle && (
            <button
              onClick={toggleAdminMode}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                isAdmin 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Settings size={16} />
              <span className="text-sm">{isAdmin ? 'Mode Coach' : 'Coach'}</span>
            </button>
          )}
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-all"
          >
            <LogOut size={16} />
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Router vers les différentes vues
  const renderCurrentView = () => {
    const views = {
      'players': () => (
        <PlayerGrid 
          {...commonProps}
          toggleAdminMode={toggleAdminMode}
          logout={logout}
        />
      ),
      'admin': () => (
        <div>
          <AppHeader title="Panel Administrateur" />
          <AdminPanel {...commonProps} />
        </div>
      ),
      'admin-player-detail': () => (
        <AdminPlayerDetail {...commonProps} />
      ),
      'player-detail': () => (
        <PlayerDetail {...commonProps} />
      ),
      'pre-session': () => (
        <PreSessionQuestionnaire {...commonProps} />
      ),
      'post-session': () => (
        <PostSessionQuestionnaire {...commonProps} />
      ),
      'match': () => (
        <MatchQuestionnaire {...commonProps} />
      ),
      'injury-followup': () => (
        <InjuryFollowupQuestionnaire {...commonProps} />
      )
    };

    const ViewComponent = views[currentView];
    
    if (ViewComponent) {
      try {
        return ViewComponent();
      } catch (error) {
        console.error(`Erreur rendu vue ${currentView}:`, error);
        return <ErrorFallback error={error} onRetry={() => setCurrentView('players')} />;
      }
    }

    // Vue par défaut si la vue n'est pas trouvée
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
        <div className="text-center bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4" style={{color: '#1D2945'}}>
            Vue non trouvée
          </h2>
          <p className="text-gray-600 mb-4">
            La vue "{currentView}" n'existe pas.
          </p>
          <button
            onClick={() => setCurrentView('players')}
            className="px-6 py-3 text-white rounded-lg hover:shadow-lg transition-all"
            style={{backgroundColor: '#1D2945'}}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {renderCurrentView()}
    </div>
  );
};

export default App;
