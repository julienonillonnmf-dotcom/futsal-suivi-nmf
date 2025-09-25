// components/PlayerCard.jsx
import React from 'react';
import { Camera, Trash2 } from 'lucide-react';

const PlayerCard = ({ 
  player, 
  onClick, 
  showAdminActions = false, 
  onPhotoUpload, 
  onDeletePlayer,
  shouldShowGreen = false 
}) => {
  
  const handlePhotoClick = (e) => {
    e.stopPropagation();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => onPhotoUpload(player.id, e.target.files[0]);
    input.click();
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDeletePlayer(player.id);
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-lg p-4 transform hover:scale-105 transition-all duration-200 border-l-4 hover:shadow-xl relative"
      style={{borderLeftColor: '#C09D5A'}}
    >
      {showAdminActions && (
        <div className="absolute top-2 right-2 flex space-x-1">
          <button
            onClick={handlePhotoClick}
            className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            title="Changer la photo"
          >
            <Camera size={12} />
          </button>
          <button
            onClick={handleDeleteClick}
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
            <div 
              className="w-full h-full flex items-center justify-center text-white text-xl font-bold" 
              style={{background: 'linear-gradient(135deg, #1D2945 0%, #C09D5A 100%)'}}
            >
              {player.name.split(' ').map(n => n[0]).join('')}
            </div>
          )}
        </div>
        
        <h3 className="font-semibold text-center" style={{color: '#1D2945'}}>
          {player.name}
        </h3>
        
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#1D2945'}}></div>
          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#C09D5A'}}></div>
          <div className={`w-3 h-3 rounded-full ${shouldShowGreen ? 'bg-green-400' : 'bg-gray-300'}`}></div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
