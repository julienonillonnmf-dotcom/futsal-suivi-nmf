// src/utils/imageUtils.js

/**
 * Redimensionne une image en gardant les proportions
 * @param {File} file - Le fichier image à redimensionner
 * @param {number} maxWidth - Largeur maximale (défaut: 400)
 * @param {number} maxHeight - Hauteur maximale (défaut: 400)
 * @param {number} quality - Qualité JPEG (défaut: 0.8)
 * @returns {Promise<Blob>} - Le fichier redimensionné
 */
export const resizeImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculer les nouvelles dimensions en gardant le ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Dessiner l'image redimensionnée
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convertir en blob
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Vérifie si un fichier est une image valide
 * @param {File} file - Le fichier à vérifier
 * @returns {boolean} - True si c'est une image valide
 */
export const isValidImage = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  return validTypes.includes(file.type) && file.size <= maxSize;
};

/**
 * Génère un nom de fichier unique
 * @param {string} playerId - ID de la joueuse
 * @param {string} extension - Extension du fichier (défaut: 'jpg')
 * @returns {string} - Nom de fichier unique
 */
export const generateFileName = (playerId, extension = 'jpg') => {
  const timestamp = Date.now();
  return `${playerId}-${timestamp}.${extension}`;
};
