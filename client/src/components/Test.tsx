import React, { useState } from 'react';
import { removeBackground } from '@imgly/background-removal';

const ImageUpload = () => {
    const [image, setImage] = useState<File | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [loadingText, setLoadingText] = useState<string>('Processing...');
    const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImage(file);
        setProcessedImage(null);
        setIsProcessing(true);
        setLoadingText('Processing...');

        // Simulate background removal and transition effect
        setTimeout(async () => {
            try {
                // Ensure file is not null
                if (!file) return;

                console.log('Processing started');

                const startTime = Date.now();
                const resultBlob = await removeBackground(file);

                const imageUrl = URL.createObjectURL(resultBlob);
                setProcessedImage(imageUrl);
                setIsTransitioning(true);  // Trigger transition effect

                const endTime = Date.now();
                const timeTaken = (endTime - startTime) / 1000; // Time in seconds
                console.log(`Processing completed in ${timeTaken} seconds`);

                setIsProcessing(false);
                setLoadingText('');
            } catch (error) {
                console.error('Error removing background:', error);
                setIsProcessing(false);
                setLoadingText('Failed to process image');
            }
        }, 1000); // Adding a small delay before starting for the transition to appear
    };

    return (
        <div className="flex flex-col items-center p-6 space-y-6">
            <h1 className="text-3xl font-semibold text-center">Background Removal</h1>

            <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="cursor-pointer"
            />

            <div className="relative w-80 h-80 overflow-hidden border-2 border-gray-300 rounded-lg">
                {/* Uploaded Image */}
                {image && !isTransitioning && !processedImage && (
                    <img
                        src={URL.createObjectURL(image)}
                        alt="Uploaded"
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${isProcessing ? 'opacity-0' : 'opacity-100'}`}
                    />
                )}

                {/* Processed Image */}
                {processedImage && isTransitioning && (
                    <img
                        src={processedImage}
                        alt="Processed"
                        className="absolute inset-0 w-full h-full object-cover opacity-100 transition-all duration-500 ease-in-out"
                    />
                )}

                {/* Loading Indicator */}
                {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                        <div className="flex items-center space-x-2">
                            <span>{loadingText}</span>
                            <div className="animate-spin rounded-full border-t-4 border-b-4 w-6 h-6"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Button to check the uploaded and processed data */}
            {!isProcessing && (
                <button
                    className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition duration-300"
                    onClick={() => {
                        alert('Uploaded and Processed Images:\n' +
                              `Uploaded: ${URL.createObjectURL(image)}\n` +
                              `Processed: ${processedImage}`);
                    }}
                >
                    Check Uploaded and Processed Data
                </button>
            )}
        </div>
    );
};

export default ImageUpload;
