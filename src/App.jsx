import React, { useState, useEffect } from 'react';
import { User, Plus, Edit3, BarChart3, Calendar, Target, Heart, Users, ChevronLeft, ChevronRight, Save, UserPlus, Lock, Eye, EyeOff, Settings, Camera, Download, TrendingUp, Upload, Trash2 } from 'lucide-react';
import { supabase } from './supabaseClient';

const FutsalApp = () => {
  const [currentView, setCurrentView] = useState('login');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
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

  // Fonction pour activer/désactiver le mode admin
  const toggleAdminMode = () => {
    console.log('toggleAdminMode appelé, isAdmin actuel:', isAdmin);
    if (!isAdmin) {
      const pwd = prompt('Mot de passe entraîneur :');
      console.log('Mot de passe saisi:', pwd ? 'OK' : 'Annulé');
      if (pwd === 'coachNmf_2026') {
        setIsAdmin(true);
        console.log('Mode admin activé');
        alert('Mode entraîneur activé');
      } else if (pwd) {
        alert('Mot de passe incorrect');
      }
    } else {
      setIsAdmin(false);
      console.log('Mode admin désactivé');
    }
  };

  // Charger les joueurs depuis Supabase
  const loadPlayers = async () => {
    console.log('Chargement des joueurs...');
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }
      
      console.log('Joueurs chargés:', data);
      
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
      alert('Erreur lors du chargement des données: ' + error.message);
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
      console.log('Utilisateur authentifié, chargement des joueurs');
      loadPlayers();
    }
  }, [isAuthenticated]);

  // Debug: Observer les changements d'état isAdmin
  useEffect(() => {
    console.log('isAdmin changé:', isAdmin);
  }, [isAdmin]);

  // Authentification
  const handleSiteLogin = () => {
    console.log('Tentative de connexion avec mot de passe:', password);
    if (password === 'NMF2026') {
      setIsAuthenticated(true);
      setCurrentView('players');
      setPassword('');
      console.log('Connexion réussie');
    } else {
      console.log('Mot de passe incorrect');
      alert('Mot de passe incorrect');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setCurrentView('login');
    setSelectedPlayer(null);
    console.log('Déconnexion');
  };

  // Export des données
  const exportData = async () => {
    console.log('Export des données...');
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
      console.log('Export terminé');
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

  // PANNEAU D'ADMINISTRATION SIMPLIFIÉ
  if (currentView === 'admin' && isAdmin) {
    console.log('Rendu du panneau admin, isAdmin:', isAdmin);
    return (
      <div className="min-h-screen p-4" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
        <div className="max-w-6xl mx-auto">
          {/* En-tête */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold" style={{color: '#1D2945'}}>
                  Administration - Mode Debug
                </h1>
                <p className="text-gray-600 mt-1">Panneau d'administration - Mode Entraîneur</p>
                <p className="text-sm text-blue-600 mt-1">Debug: isAdmin = {isAdmin.toString()}</p>
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

          {/* Section de test */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6" style={{color: '#1D2945'}}>
              Test de fonctionnement
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800">✅ Panneau admin accessible</h3>
                <p className="text-sm text-gray-600">Le mode administrateur fonctionne correctement</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800">ℹ️ Informations de debug</h3>
                <ul className="text-sm text-gray-600 mt-2">
                  <li>• Vue actuelle: {currentView}</li>
                  <li>• Mode admin: {isAdmin ? 'Activé' : 'Désactivé'}</li>
                  <li>• Joueurs chargés: {players.length}</li>
                  <li>• Utilisateur authentifié: {isAuthenticated ? 'Oui' : 'Non'}</li>
                </ul>
              </div>

              <button
                onClick={exportData}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                <Download size={16} />
                <span>Test Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interface principale
  if (currentView === 'players') {
    console.log('Rendu interface principale, isAdmin:', isAdmin);
    return (
      <div className="min-h-screen p-4" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{background: 'linear-gradient(135deg, #1D2945 0%, #C09D5A 100%)'}}>
            <div className="text-white text-2xl font-bold">⚽</div>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{color: '#1D2945'}}>Équipe Futsal Féminine</h1>
          <p className="text-gray-600">Nantes Métropole Futsal</p>
          <p className="text-xs text-blue-600 mt-2">Debug: Mode admin = {isAdmin.toString()}</p>
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
                  onClick={() => {
                    console.log('Clic sur Administration, isAdmin:', isAdmin);
                    setCurrentView('admin');
                  }}
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

  // Retour par défaut
  return (
    <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
      <div className="text-center bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-4" style={{color: '#1D2945'}}>
          Vue non trouvée
        </h2>
        <p className="text-gray-600 mb-4">Vue actuelle: {currentView}</p>
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
