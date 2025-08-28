import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CameraIcon } from '../Icons';

interface FaceLockModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (faceData: string) => void;
}

export const FaceLockModal: React.FC<FaceLockModalProps> = ({ show, onClose, onSave }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [imageData, setImageData] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let streamInstance: MediaStream | null = null;
        let active = true;

        const startCamera = async () => {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                    if (active) {
                        streamInstance = stream;
                        if (videoRef.current) {
                            videoRef.current.srcObject = stream;
                        }
                        setError(null);
                    } else {
                        stream.getTracks().forEach(track => track.stop());
                    }
                } catch (err) {
                    console.error("Error accessing camera:", err);
                    if (active) {
                        setError("Could not access camera. Please check permissions.");
                    }
                }
            } else {
                if (active) {
                    setError("Camera access is not supported by this browser.");
                }
            }
        };

        if (show) {
            setImageData(null); // Reset image data when modal opens
            setError(null);
            startCamera();
        }

        return () => {
            active = false;
            if (streamInstance) {
                streamInstance.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [show]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                // Flip the image horizontally for a mirror effect
                context.translate(canvas.width, 0);
                context.scale(-1, 1);
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/png');
                setImageData(dataUrl);
            }
        }
    };
    
    const handleSave = () => {
        if (imageData) {
            // The image is already flipped from the capture, so we just save it.
            onSave(imageData);
            onClose();
        }
    };
    
    const handleClose = () => {
        onClose();
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[80]">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg mx-auto w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Setup Facelock</h3>
                {error && <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">{error}</div>}
                <div className="relative w-full aspect-video bg-gray-200 rounded-md overflow-hidden mb-4">
                    {imageData ? (
                        <img src={imageData} alt="Captured face" className="w-full h-full object-cover" />
                    ) : (
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]"></video>
                    )}
                </div>

                <div className="flex justify-between items-center space-x-4">
                    <button onClick={handleClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">
                        Cancel
                    </button>
                    {imageData ? (
                        <div className="flex space-x-2">
                             <button onClick={() => setImageData(null)} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600">
                                Retake
                            </button>
                             <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                                Save Face
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={handleCapture} 
                            disabled={!!error}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-2">
                            <CameraIcon /> Capture
                        </button>
                    )}
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
    );
};