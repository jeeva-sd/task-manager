import React, { useRef, useState } from 'react';
import * as bodyPix from '@tensorflow-models/body-pix';
import '@tensorflow/tfjs';

const ImageBackgroundRemoval: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load and remove background from the image
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const imageURL = URL.createObjectURL(file);
    setOriginalImage(imageURL);

    // Wait for image to load in the canvas
    const img = new Image();
    img.src = imageURL;
    img.onload = async () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Set canvas size to match the image
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        // Load BodyPix model
        const net = await bodyPix.load();

        // Perform segmentation
        const segmentation = await net.segmentPerson(canvas, {
          internalResolution: 'medium',
          segmentationThreshold: 0.7,
        });

        // Create a new image based on the segmentation mask
        const { data: mask } = segmentation;
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const pixelData = imageData.data;

        // Apply the mask to remove background
        for (let i = 0; i < pixelData.length; i += 4) {
          if (mask[i / 4] === 0) {
            // Set background pixels to transparent
            pixelData[i + 3] = 0;
          }
        }
        context.putImageData(imageData, 0, 0);

        // Convert canvas to image URL and display it
        const processedImageUrl = canvas.toDataURL();
        setProcessedImage(processedImageUrl);

        // Clean up
        net.dispose();
        URL.revokeObjectURL(imageURL);
      }
    };
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <div style={{ marginTop: '20px' }}>
        {originalImage && (
          <div>
            <h3>Original Image:</h3>
            <img src={originalImage} alt="Original" style={{ maxWidth: '300px' }} />
          </div>
        )}
        {processedImage && (
          <div>
            <h3>Image with Background Removed:</h3>
            <img src={processedImage} alt="Background Removed" style={{ maxWidth: '300px' }} />
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default ImageBackgroundRemoval;
