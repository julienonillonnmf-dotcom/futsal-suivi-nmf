// App.jsx - Composant principal restructuré
import React, { useState, useEffect } from 'react';
import { Lock, EyeOff, Eye } from 'lucide-react';
import { supabase } from './supabaseClient';

// Import des composants
import PlayerGrid from './components/PlayerGrid';
import AdminPanel from './views/AdminPanel';
import PlayerDetail from './views/PlayerDetail';
import AdminPlayerDetail from './views/AdminPlayerDetail';
import PreSessionQuestionnaire from './views/PreSessionQuestionnaire';
import PostSessionQuestionnaire from './views/PostSessionQuestionnaire';
import MatchQuestionnaire from './views/MatchQuestionnaire';
import InjuryFollowupQuestionnaire from './views/InjuryFollowupQuestionnaire';

const App = () => {
  // États principaux
  const [currentView, setCurrentView] = useState('login');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Données
  const [players, setPlayers] = useState([]);
  const [playerStats, setPlayerStats] = useState({});
  const [objectifsCollectifs, setObjectifsCollectifs] = useState('');
  const [objectifsIndividuels, setObjectifsIndividuels] = useState({});
  const [objectifsMentaux, setObjectifsMentaux] = useState({});

  // Jours d'entraînement
  const trainingDays = [1, 2, 4]; // Lundi, Mardi, Jeudi

  // Fonction pour vérifier si aujourd'hui est un jour d'entraînement
  const isTodayTrainingDay = () => {
    const today = new Date().getDay();
    return trainingDays.includes(today);
  };

  // Fonction pour vérifier si une joueuse a répondu aujourd'hui
  const hasAnsweredToday = (player) => {
    if (!player.responses) return false;
    const today = new Date().toDateString();
    return player.responses.some(response => 
      new Date(response.created_at).toDateString() === today
    );
  };

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
      await loadObjectifs();
    } catch (error) {
      console.error('Erreur lors du chargement des joueurs:', error);
      alert('Erreur lors du chargement des données');
    }
    setLoading(false);
  };

  // Charger les statistiques
  const loadPlayerStatistics = (playersData = players) => {
    const stats = {};
    playersData.forEach(player => {
      const preResponses = player.responses?.filter(r => r.type === 'pre') || [];
      const postResponses = player.responses?.filter(r => r.type === 'post') || [];
      const matchResponses = player.responses?.filter(r => r.type === 'match') || [];
      
      // Données pour les graphiques
      const chartData = player.responses?.map(response => ({
        date: new Date(response.created_at).toLocaleDateString('fr-FR'),
        ...response.data,
        type: response.type
      })) || [];

      stats[player.id] = {
        total_responses: player.responses?.length || 0,
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
        last_response_date: player.responses?.length > 0 
          ? new Date(Math.max(...player.responses.map(r => new Date(r.created_at)))).toLocaleDateString('fr-FR')
          : null,
        chartData: chartData
      };
    });
    setPlayerStats(stats);
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
    hasAnsweredToday
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

  // Router vers les différentes vues
  switch (currentView) {
    case 'players':
      return (
        <PlayerGrid 
          {...commonProps}
          toggleAdminMode={toggleAdminMode}
          logout={logout}
        />
      );
    
    case 'admin':
      return <AdminPanel {...commonProps} />;
    
    case 'admin-player-detail':
      return <AdminPlayerDetail {...commonProps} />;
    
    case 'player-detail':
      return <PlayerDetail {...commonProps} />;
    
    case 'pre-session':
      return <PreSessionQuestionnaire {...commonProps} />;
    
    case 'post-session':
      return <PostSessionQuestionnaire {...commonProps} />;
    
    case 'match':
      return <MatchQuestionnaire {...commonProps} />;
    
    case 'injury-followup':
      return <InjuryFollowupQuestionnaire {...commonProps} />;
    
    default:
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
  }
};

export default App;
