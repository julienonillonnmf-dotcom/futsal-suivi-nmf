// views/AdminPlayerDetail.jsx - Version améliorée avec édition photo et objectifs
import React, { useState, useRef } from 'react';
import { 
  ChevronLeft, 
  Camera, 
  Edit3, 
  Save, 
  X, 
  Upload,
  User,
  Target,
  Brain,
  Calendar,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { resizeImage } from '../utils/imageUtils';

const AdminPlayerDetail = ({ 
  selectedPlayer,
  setSelectedPlayer,
  setCurrentView,
  loading,
  setLoading,
  playerStats,
  objectifsIndividuels,
  setObjectifsIndividuels,
  objectifsMentaux,
  setObjectifsMentaux,
  players,
  setPlayers,
  supabase
}) => {
  
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [editingTechnical, setEditingTechnical] = useState(false);
  const [editingMental, setEditingMental] = useState(false);
  const [tempTechnicalObjectives, setTempTechnicalObjectives] = useState('');
  const [tempMentalObjectives, setTempMentalObjectives] = useState('');
  const fileInputRef = useRef(null);

  if (!selectedPlayer) return null;

  const stats = playerStats[selectedPlayer.id] || {};

  // Initialiser les objectifs temporaires
  React.useEffect(() => {
    setTempTechnicalObjectives(objectifsIndividuels[selectedPlayer.id] || '');
    setTempMentalObjectives(objectifsMentaux[selectedPlayer.id] || '');
  }, [selectedPlayer.id, objectifsIndividuels, objectifsMentaux]);

  // Upload de photo amélioré
  const handlePhotoUpload = async (file) => {
    if (!file) return;
    
    setLoading(true);
    try {
      // Valider le fichier
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB max
        alert('Le fichier est trop volumineux. Maximum 5MB.');
        return;
      }

      const resizedFile = await resizeImage(file);
      
      const fileExt = 'jpg';
      const fileName = `${selectedPlayer.id}-${Date.now()}.${fileExt}`;
      const filePath = `player-photos/${fileName}`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, resizedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: publicUrl } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      // Mettre à jour la base de données
      const { error: updateError } = await supabase
        .from('players')
        .update({ photo_url: publicUrl.publicUrl })
        .eq('id', selectedPlayer.id);

      if (updateError) throw updateError;

      // Mettre à jour l'état local
      const updatedPlayer = { ...selectedPlayer, photo_url: publicUrl.publicUrl };
      setSelectedPlayer(updatedPlayer);
      setPlayers(prev => prev.map(p => 
        p.id === selectedPlayer.id ? updatedPlayer : p
      ));

      setEditingPhoto(false);
      alert('Photo mise à jour avec succès !');

    } catch (error) {
      console.error('Erreur upload photo:', error);
      alert('Erreur lors de la mise à jour de la photo: ' + error.message);
    }
    setLoading(false);
  };

  // Sauvegarder les objectifs techniques
  const saveTechnicalObjectives = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('players')
        .update({ objectifs_individuels: tempTechnicalObjectives || null })
        .eq('id', selectedPlayer.id);
      
      if (error) throw error;
      
      setObjectifsIndividuels(prev => ({
        ...prev,
        [selectedPlayer.id]: tempTechnicalObjectives
      }));
      
      setEditingTechnical(false);
      alert('Objectifs techniques sauvegardés !');
      
    } catch (error) {
      console.error('Erreur sauvegarde objectifs techniques:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
    }
    setLoading(false);
  };

  // Sauvegarder les objectifs mentaux
  const saveMentalObjectives = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('players')
        .update({ objectifs_mentaux: tempMentalObjectives || null })
        .eq('id', selectedPlayer.id);
      
      if (error) throw error;
      
      setObjectifsMentaux(prev => ({
        ...prev,
        [selectedPlayer.id]: tempMentalObjectives
      }));
      
      setEditingMental(false);
      alert('Objectifs mentaux sauvegardés !');
      
    } catch (error) {
      console.error('Erreur sauvegarde objectifs mentaux:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #fef9e7 100%)'}}>
      <div className="max-w-6xl mx-auto p-4">
        
        {/* En-tête avec retour */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentView('admin')}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
            >
              <ChevronLeft size={20} />
              <span>Retour Administration</span>
            </button>
            <h1 className="text-2xl font-bold" style={{color: '#1D2945'}}>
              Administration - {selectedPlayer.name}
            </h1>
            <div className="w-32"></div> {/* Spacer pour centrer le titre */}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Colonne 1: Profil et Photo */}
          <div className="space-y-6">
            
            {/* Section Photo de Profil */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{color: '#1D2945'}}>
                  <User className="inline mr-2" size={20} />
                  Photo de Profil
                </h2>
                <button
                  onClick={() => setEditingPhoto(!editingPhoto)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    editingPhoto 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                >
                  {editingPhoto ? <X size={16} /> : <Edit3 size={16} />}
                  <span>{editingPhoto ? 'Annuler' : 'Modifier'}</span>
                </button>
              </div>

              <div className="text-center">
                {/* Affichage de la photo */}
                <div className="w-24 h-24 rounded-full mx-auto mb-3 overflow-hidden border-3 border-gray-200">
                  {selectedPlayer.photo_url ? (
                    <img 
                      src={selectedPlayer.photo_url} 
                      alt={selectedPlayer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-white text-lg font-bold"
                      style={{background: 'linear-gradient(135deg, #1D2945 0%, #C09D5A 100%)'}}
                    >
                      {selectedPlayer.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold mb-3" style={{color: '#1D2945'}}>
                  {selectedPlayer.name}
                </h3>

                {/* Interface d'upload compacte */}
                {editingPhoto && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(file);
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-all disabled:opacity-50 mx-auto"
                    >
                      <Upload size={14} />
                      <span>{loading ? 'Upload...' : 'Nouvelle photo'}</span>
                    </button>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, GIF - Max 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Statistiques rapides */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4" style={{color: '#1D2945'}}>
                <BarChart3 className="inline mr-2" size={20} />
                Statistiques
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Réponses totales:</span>
                  <span className="font-semibold">{stats.total_responses || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Motivation moyenne:</span>
                  <span className="font-semibold">{stats.avg_motivation || 0}/20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fatigue moyenne:</span>
                  <span className="font-semibold">{stats.avg_fatigue || 0}/20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">RPE moyen:</span>
                  <span className="font-semibold">{stats.avg_rpe || 0}/20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dernière réponse:</span>
                  <span className="font-semibold text-sm">{stats.last_response_date || 'Aucune'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne 2: Objectifs Personnels */}
          <div className="space-y-6">
            
            {/* Objectifs Techniques */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{color: '#1D2945'}}>
                  <Target className="inline mr-2" size={20} />
                  Objectifs Techniques
                </h2>
                <button
                  onClick={() => {
                    if (editingTechnical) {
                      setTempTechnicalObjectives(objectifsIndividuels[selectedPlayer.id] || '');
                    }
                    setEditingTechnical(!editingTechnical);
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    editingTechnical 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                >
                  {editingTechnical ? <X size={16} /> : <Edit3 size={16} />}
                  <span>{editingTechnical ? 'Annuler' : 'Modifier'}</span>
                </button>
              </div>

              {editingTechnical ? (
                <div className="space-y-4">
                  <textarea
                    value={tempTechnicalObjectives}
                    onChange={(e) => setTempTechnicalObjectives(e.target.value)}
                    placeholder="Définissez les objectifs techniques pour cette joueuse..."
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={6}
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={saveTechnicalObjectives}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50"
                    >
                      <Save size={16} />
                      <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg min-h-[120px]">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {objectifsIndividuels[selectedPlayer.id] || 'Aucun objectif technique défini.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Objectifs Mentaux */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{color: '#1D2945'}}>
                  <Brain className="inline mr-2" size={20} />
                  Objectifs Mentaux
                </h2>
                <button
                  onClick={() => {
                    if (editingMental) {
                      setTempMentalObjectives(objectifsMentaux[selectedPlayer.id] || '');
                    }
                    setEditingMental(!editingMental);
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    editingMental 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                >
                  {editingMental ? <X size={16} /> : <Edit3 size={16} />}
                  <span>{editingMental ? 'Annuler' : 'Modifier'}</span>
                </button>
              </div>

              {editingMental ? (
                <div className="space-y-4">
                  <textarea
                    value={tempMentalObjectives}
                    onChange={(e) => setTempMentalObjectives(e.target.value)}
                    placeholder="Définissez les objectifs mentaux pour cette joueuse..."
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows={6}
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={saveMentalObjectives}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50"
                    >
                      <Save size={16} />
                      <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 rounded-lg min-h-[120px]">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {objectifsMentaux[selectedPlayer.id] || 'Aucun objectif mental défini.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Colonne 3: Historique et Graphiques */}
          <div className="space-y-6">
            
            {/* Graphique d'évolution */}
            {stats.chartData && stats.chartData.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold mb-4" style={{color: '#1D2945'}}>
                  <Calendar className="inline mr-2" size={20} />
                  Évolution des Métriques
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats.chartData.slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 20]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="motivation" stroke="#2563eb" strokeWidth={2} />
                    <Line type="monotone" dataKey="fatigue" stroke="#dc2626" strokeWidth={2} />
                    <Line type="monotone" dataKey="intensite_rpe" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Historique des réponses récentes */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4" style={{color: '#1D2945'}}>
                <MessageSquare className="inline mr-2" size={20} />
                Réponses Récentes
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {selectedPlayer.responses && selectedPlayer.responses.length > 0 ? (
                  selectedPlayer.responses.slice(0, 8).map((response, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          response.type === 'pre' ? 'bg-blue-100 text-blue-800' :
                          response.type === 'post' ? 'bg-green-100 text-green-800' :
                          response.type === 'match' ? 'bg-purple-100 text-purple-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {response.type === 'pre' ? 'Pré-séance' :
                           response.type === 'post' ? 'Post-séance' :
                           response.type === 'match' ? 'Match' : 'Blessure'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(response.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        {response.data.motivation && (
                          <p><span className="font-medium">Motivation:</span> {response.data.motivation}/20</p>
                        )}
                        {response.data.fatigue && (
                          <p><span className="font-medium">Fatigue:</span> {response.data.fatigue}/20</p>
                        )}
                        {response.data.intensite_rpe && (
                          <p><span className="font-medium">RPE:</span> {response.data.intensite_rpe}/20</p>
                        )}
                        {response.data.commentaires_libres && (
                          <p className="text-gray-600 italic">"{response.data.commentaires_libres}"</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Aucune réponse enregistrée pour cette joueuse.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPlayerDetail;
