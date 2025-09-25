// App.jsx - Composant principal restructuré et optimisé
import React, { useState, useEffect, useCallback } from 'react';
import { Lock, EyeOff, Eye, Settings, LogOut } from 'lucide-react';
import { supabase } from './supabaseClient';

// Imports directs pour TOUS les composants (pas de lazy loading)
import PlayerGrid from './components/PlayerGrid';
import AdminPanel from './views/AdminPanel';
import PlayerDetail from './views/PlayerDetail';
import AdminPlayerDetail from './views/AdminPlayerDetail';
import PreSessionQuestionnaire from './views/PreSessionQuestionnaire';
import PostSessionQuestionnaire from './views/PostSessionQuestionnaire';
import MatchQuestionnaire from './views/MatchQuestionnaire';
import InjuryFollowupQuestionnaire from './views/InjuryFollowupQuestionnaire';

  // Composant de fallback amélioré avec animation plus fluide
  const LoadingFallback = ({ text = "Chargement..." }) => (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95">
      <div className="text-center">
        <div 
          className="w-8 h-8 border-2 border-b-transparent rounded-full animate-spin mx-auto mb-2" 
          style={{borderColor: '#1D2945'}}
        ></div>
        <p className="text-sm text-gray-500">{text}</p>
      </div>
    </div>
  );

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
  
  // Données
  const [players, setPlayers] = useState([]);
  const [playerStats, setPlayerStats] = useState({});
  const [objectifsCollectifs, setObjectifsCollectifs] = useState('');
  const [objectifsIndividuels, setObjectifsIndividuels] = useState({});
  const [objectifsMentaux, setObjectifsMentaux] = useState({});

  // Configuration
  const trainingDays = [1, 2, 4]; // Lundi, Mardi, Jeudi
  const SITE_PASSWORD = 'NMF2026';
  const ADMIN_PASSWORD = 'coachNmf_2026';

  // Fonction pour vérifier si aujourd'hui est un jour d'entraînement
  const isTodayTrainingDay = useCallback(() => {
    const today = new Date().getDay();
    return trainingDays.includes(today);
  }, [trainingDays]);

  // Fonction pour vérifier si une joueuse a répondu aujourd'hui
  const hasAnsweredToday = useCallback((player) => {
    if (!player?.responses) return false;
    const today = new Date().toDateString();
    return player.responses.some(response => 
      new Date(response.created_at).toDateString() === today
    );
  }, []);

  // Fonction pour activer/désactiver le mode admin
  const toggleAdminMode = useCallback(() => {
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
  }, [isAdmin, currentView, ADMIN_PASSWORD]);

  // Charger les statistiques
  const loadPlayerStatistics = useCallback((playersData = players) => {
    try {
      const stats = {};
      playersData.forEach(player => {
        if (!player.responses) return;
        
        const preResponses = player.responses.filter(r => r.type === 'pre') || [];
        const postResponses = player.responses.filter(r => r.type === 'post') || [];
        const matchResponses = player.responses.filter(r => r.type === 'match') || [];
        
        // Données pour les graphiques
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
    }
  }, [players]);

  // Charger les objectifs depuis Supabase
  const loadObjectifs = useCallback(async () => {
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

      // Charger les objectifs individuels et mentaux
      const { data: individuels, error: errorIndividuels } = await supabase
        .from('players')
        .select('id, objectifs_individuels, objectifs_mentaux')
        .eq('is_active', true);

      if (errorIndividuels) {
        console.error('Erreur chargement objectifs individuels:', errorIndividuels);
      } else {
        const objIndiv = {};
        const objMentaux = {};
        individuels?.forEach(player => {
          objIndiv[player.id] = player.objectifs_individuels || '';
          objMentaux[player.id] = player.objectifs_mentaux || '';
        });
        setObjectifsIndividuels(objIndiv);
        setObjectifsMentaux(objMentaux);
      }

    } catch (error) {
      console.error('Erreur chargement objectifs:', error);
    }
  }, []);

  // Charger les joueurs depuis Supabase
  const loadPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
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
      await loadObjectifs();
    } catch (error) {
      console.error('Erreur lors du chargement des joueurs:', error);
      setError(error);
    }
    setLoading(false);
  }, [loadPlayerStatistics, loadObjectifs]);

  // Charger les joueurs quand l'utilisateur est authentifié
  useEffect(() => {
    if (isAuthenticated) {
      loadPlayers();
    }
  }, [isAuthenticated, loadPlayers]);

  // Authentification
  const handleSiteLogin = useCallback(() => {
    if (password === SITE_PASSWORD) {
      setIsAuthenticated(true);
      setCurrentView('players');
      setPassword('');
      setError(null);
    } else {
      alert('Mot de passe incorrect');
    }
  }, [password, SITE_PASSWORD]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setCurrentView('login');
    setSelectedPlayer(null);
    setPlayers([]);
    setPlayerStats({});
    setError(null);
  }, []);

  // Gestionnaire d'erreur pour retry
  const handleRetry = useCallback(() => {
    setError(null);
    if (isAuthenticated) {
      loadPlayers();
    } else {
      window.location.reload();
    }
  }, [isAuthenticated, loadPlayers]);

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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                style={{focusRingColor: '#1D2945'}}
                placeholder="Entrez le mot de passe"
                onKeyPress={(e) => e.key === 'Enter' && handleSiteLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <button
            onClick={handleSiteLogin}
            disabled={!password || loading}
            className="w-full text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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

  // Router vers les différentes vues (plus de Suspense = plus de clignotement)
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
