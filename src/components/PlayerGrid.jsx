// src/components/PlayerGrid.jsx

import React from 'react';
import PlayerCard from './PlayerCard';
import { resizeImage } from '../utils/imageUtils';

const PlayerGrid = ({ 
  players, 
  setPlayers, 
  setSelectedPlayer, 
  setCurrentView, 
  loading, 
  setLoading, 
  isAdmin, 
  toggleAdminMode, 
  logout, 
  supabase, 
  loadPlayers,
  isTodayTrainingDay,
  hasAnsweredToday 
}) => {

  // AMÉLIORATION: Upload avec redimensionnement automatique
  const handlePhotoUpload = async (playerId, file) => {
    if (!file) return;
    
    setLoading(true);
    try {
      // Redimensionner automatiquement à 400x400px avec qualité 80%
      const resizedFile = await resizeImage(file, 400, 400, 0.8);
      
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

  const handleDeletePlayer = async (playerId) => {
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
              onPhotoUpload={handlePhotoUpload}
              onDeletePlayer={handleDeletePlayer}
              shouldShowGreen={isTodayTrainingDay() && hasAnsweredToday(player)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerGrid;
