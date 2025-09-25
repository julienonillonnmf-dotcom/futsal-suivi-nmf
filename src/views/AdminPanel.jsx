// views/AdminPanel.jsx
import React, { useState } from 'react';
import { ChevronLeft, Edit3, UserPlus, Download, Camera, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { resizeImage } from '../utils/imageUtils';

const AdminPanel = ({ 
  players,
  setPlayers,
  setSelectedPlayer,
  setCurrentView,
  loading,
  setLoading,
  playerStats,
  objectifsCollectifs,
  setObjectifsCollectifs,
  objectifsIndividuels,
  setObjectifsIndividuels,
  objectifsMentaux,
  setObjectifsMentaux,
  loadPlayers,
  supabase
}) => {
  
  const [editingObjectives, setEditingObjectives] = useState(false);

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

  // Sauvegarder les objectifs mentaux
  const saveObjectifsMentaux = async (playerId, objectifs) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('players')
        .update({ objectifs_mentaux: objectifs })
        .eq('id', playerId);
      
      if (error) throw error;
      
      setObjectifsMentaux(prev => ({
        ...prev,
        [playerId]: objectifs
      }));
      
      alert('Objectifs mentaux sauvegardés !');
      
    } catch (error) {
      console.error('Erreur sauvegarde objectifs mentaux:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
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

  // Upload de photo
  const handlePhotoUpload = async (playerId, file) => {
    if (!file) return;
    
    setLoading(true);
    try {
      // Redimensionner l'image
      const resizedFile = await resizeImage(file);
      
      // Upload vers Supabase Storage
      const fileExt = 'jpg';
      const fileName = `${playerId}-${Date.now()}.${fileExt}`;
      const filePath = `player-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, resizedFile, { upsert: true });

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

  // Supprimer un joueur
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
