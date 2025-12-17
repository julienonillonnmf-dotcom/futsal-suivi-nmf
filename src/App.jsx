import React, { useState, useEffect, useCallback } from 'react';
import { Lock, EyeOff, Eye, Settings, LogOut } from 'lucide-react';
import { supabase } from './supabaseClient';

// ✅ IMPORT NOTIFICATIONS
import { initializePushNotifications, saveDeviceToken } from './services/pushNotificationService';

// Imports composants (adapter selon tes fichiers)
import PlayerGrid from './components/PlayerGrid';
// import AdminPanel from './views/AdminPanel';
// import PlayerDetail from './views/PlayerDetail';
// import AdminPlayerDetail from './views/AdminPlayerDetail';
// import PreSessionQuestionnaire from './views/PreSessionQuestionnaire';
// import PostSessionQuestionnaire from './views/PostSessionQuestionnaire';
// import MatchQuestionnaire from './views/MatchQuestionnaire';
// import InjuryFollowupQuestionnaire from './views/InjuryFollowupQuestionnaire';

const App = () => {
  // ============================================================
  // STATES DE BASE
  // ============================================================
  const [currentView, setCurrentView] = useState('login');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [players, setPlayers] = useState([]);
  const [playerStats, setPlayerStats] = useState({});
  const [objectifsCollectifs, setObjectifsCollectifs] = useState('');
  const [objectifsIndividuels, setObjectifsIndividuels] = useState({});
  const [objectifsMentaux, setObjectifsMentaux] = useState({});
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);

  // ✅ NOTIFICATIONS STATES
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('initializing');

  // ============================================================
  // CONFIGURATION
  // ============================================================
  const trainingDays = [1, 2, 4]; // Lundi, Mardi, Jeudi
  const SITE_PASSWORD = 'NMF2026';
  const ADMIN_PASSWORD = 'coachNmf_2026';
  
  // ✅ FIREBASE SENDER ID (À partir de ton Firebase)
  const FIREBASE_SENDER_ID = '994765829782';

  // ============================================================
  // ✅ USEEFFECT: INITIALISER LES NOTIFICATIONS AU DÉMARRAGE
  // ============================================================
  useEffect(() => {
    const initNotifications = async () => {
      console.log('🔔 Initializing push notifications...');
      setNotificationStatus('initializing');

      try {
        const result = await initializePushNotifications(FIREBASE_SENDER_ID);

        if (result.success) {
          setNotificationsEnabled(true);
          setNotificationStatus('enabled');
          console.log('✅ Push notifications initialized successfully');
          console.log('📱 Device token:', result.token);
        } else {
          setNotificationsEnabled(false);
          setNotificationStatus('failed');
          console.warn('⚠️ Could not initialize notifications:', result.error);
        }
      } catch (error) {
        setNotificationsEnabled(false);
        setNotificationStatus('error');
        console.error('❌ Error initializing notifications:', error);
      }
    };

    initNotifications();
  }, []);

  // ============================================================
  // ✅ USEEFFECT: SAUVEGARDER LE TOKEN APRÈS CONNEXION
  // ============================================================
  useEffect(() => {
    if (isAuthenticated && notificationsEnabled && selectedPlayer) {
      const saveToken = async () => {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();

          if (subscription) {
            const token = subscription.endpoint.split('/').pop();
            console.log('💾 Saving token for player:', selectedPlayer.id);
            await saveDeviceToken(supabase, selectedPlayer.id, token);
          }
        } catch (error) {
          console.warn('⚠️ Could not save device token:', error);
        }
      };

      saveToken();
    }
  }, [isAuthenticated, notificationsEnabled, selectedPlayer]);

  // ============================================================
  // FONCTIONS EXISTANTES
  // ============================================================
  
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

  const loadObjectifs = async () => {
    try {
      console.log('📋 Chargement objectifs...');

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

  const loadPlayers = async () => {
    if (isLoadingPlayers) {
      console.log('⚠️ loadPlayers déjà en cours, ignoré');
      return;
    }

    console.log('🔄 Début loadPlayers à:', new Date().toLocaleTimeString());
    setIsLoadingPlayers(true);
    setLoading(true);
    setError(null);

    try {
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

      setPlayers(playersWithResponses);
      loadPlayerStatistics(playersWithResponses);

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

  useEffect(() => {
    console.log('⚡ useEffect déclenché - isAuthenticated:', isAuthenticated);
    if (isAuthenticated && !isLoadingPlayers && players.length === 0) {
      loadPlayers();
    }
  }, [isAuthenticated]);

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

  const handleSiteLogin = () => {
    if (loading) return;

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

  const handleRetry = () => {
    setError(null);
    setIsLoadingPlayers(false);
    if (isAuthenticated) {
      loadPlayers();
    } else {
      window.location.reload();
    }
  };

  // ============================================================
  // PROPS COMMUNES
  // ============================================================
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
    setError,
    notificationsEnabled,
    notificationStatus,
  };

  // ============================================================
  // ÉCRAN DE CONNEXION
  // ============================================================
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
            
            {/* ✅ AFFICHER LE STATUT DES NOTIFICATIONS */}
            <div className="mt-4 text-xs">
              {notificationsEnabled ? (
                <p className="text-green-600">✅ Notifications activées</p>
              ) : notificationStatus === 'initializing' ? (
                <p className="text-blue-600">⏳ Initialisation des notifications...</p>
              ) : (
                <p className="text-amber-600">⚠️ Notifications: {notificationStatus}</p>
              )}
            </div>
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

  // ============================================================
  // HEADER COMMUN
  // ============================================================
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

  // ============================================================
  // ROUTEUR DES VUES
  // ============================================================
  const renderCurrentView = () => {
    const views = {
      'players': () => (
        <>
          <AppHeader title="Joueurs Futsal NMF" showAdminToggle={true} />
          <PlayerGrid {...commonProps} toggleAdminMode={toggleAdminMode} />
        </>
      ),
      // À ajouter: admin, player-detail, questionnaires, etc.
    };

    const ViewComponent = views[currentView];

    if (ViewComponent) {
      try {
        return ViewComponent();
      } catch (error) {
        console.error(`Erreur rendu vue ${currentView}:`, error);
        return (
          <>
            <AppHeader title="Erreur" />
            <div className="p-4 text-red-600">Erreur de chargement</div>
          </>
        );
      }
    }

    return (
      <>
        <AppHeader title="Vue non trouvée" />
        <div className="p-4">Vue non trouvée</div>
      </>
    );
  };

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50 relative">
      {renderCurrentView()}
    </div>
  );
};

export default App;
