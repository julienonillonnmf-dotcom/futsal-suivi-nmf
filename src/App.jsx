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

  // Interface principale avec boutons admin corrigés
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
          {/* NOUVELLE VERSION SIMPLIFIÉE DES BOUTONS */}
          <div className="flex justify-center items-center space-x-4 mb-8">
            {/* Boutons gauche */}
            <div className="flex space-x-2">
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
            
            {/* Boutons admin - Affichés seulement si isAdmin est true */}
            {isAdmin && (
              <div className="flex space-x-2">
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
              />
            ))}
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
