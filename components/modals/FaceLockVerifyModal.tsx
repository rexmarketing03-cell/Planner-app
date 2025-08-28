
import React, { useState, useRef, useEffect } from 'react';
import { CameraIcon, ShieldCheckIcon } from '../Icons';

interface FaceLockVerifyModalProps {
    show: boolean;
    onClose: () => void;
    onVerify: (success: boolean) => void;
}

export const FaceLockVerifyModal: React.FC<FaceLockVerifyModalProps> = ({ show, onClose, onVerify }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

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
                    if (active) setError("Could not access camera. Please check permissions.");
                }
            } else {
                if (active) setError("Camera access is not supported by this browser.");
            }
        };

        if (show) {
            setError(null);
            setIsVerifying(false);
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

    const handleVerify = () => {
        setIsVerifying(true);
        // In a real app, you would capture a frame and send it to a face recognition API.
        // Here, we simulate a successful verification after a short delay.
        setTimeout(() => {
            onVerify(true);
        }, 1500);
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[80]">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg mx-auto w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Facelock Verification</h3>
                {error && <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">{error}</div>}
                <div className="relative w-full aspect-video bg-gray-200 rounded-md overflow-hidden mb-4">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]"></video>
                    {isVerifying && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white">
                            <ShieldCheckIcon />
                            <p className="mt-2 font-semibold">Verifying...</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400" disabled={isVerifying}>
                        Cancel
                    </button>
                    <button 
                        onClick={handleVerify} 
                        disabled={!!error || isVerifying}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-2">
                        <CameraIcon /> {isVerifying ? 'Verifying...' : 'Verify Face'}
                    </button>
                </div>
            </div>
        </div>
    );
};
