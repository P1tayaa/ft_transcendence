
import React, { useState, useEffect } from 'react';

const ImageLoader = ({ apiUrl }) => {
  const [imageSrc, setImageSrc] = useState('');
  const defaultImage = `${process.env.PUBLIC_URL}/pong.icon.png`;

  useEffect(() => {
    // Fetch the image from the API
    const fetchImage = async () => {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch image');
        }
        const data = await response.blob(); // Assuming API returns a blob
        const imageUrl = URL.createObjectURL(data);
        setImageSrc(imageUrl);
      } catch (error) {
        console.error(error);
        setImageSrc(defaultImage);
      }
    };

    fetchImage();
  }, [apiUrl]);

  // Fallback for any unexpected loading error
  const handleImageError = () => {
    setImageSrc(defaultImage);
  };

  return (
    <img
      src={imageSrc || defaultImage}
      alt="Loaded from API or default"
      onError={handleImageError}
    />
  );
};

export default ImageLoader;
