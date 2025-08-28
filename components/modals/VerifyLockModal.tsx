import React, { useState, useRef, useEffect } from 'react';
import type { Operator } from '../../types';
import { XIcon, CheckIcon, KeyIcon, GridIcon, CameraIcon } from '../Icons';

// Pattern Lock Constants
const DOT_SIZE = 16;
const GRID_SIZE = 250;
const DOT_COLOR = '#9ca3af';
const DOT_ACTIVE_COLOR = '#4f46e5';
const LINE_COLOR = '#6366f1';

interface VerifyLockModalProps {
    show: boolean;
    onClose: () => void;
    operator: Operator | null;
}

export const VerifyLockModal: React.FC<VerifyLockModalProps> = ({ show, onClose, operator }) => {
    // PIN State
    const [pinInput, setPinInput] = useState('');
    const [pinStatus, setPinStatus] = useState<'idle' | 'success' | 'fail'>('idle');

    // Pattern State
    const [path, setPath] = useState<number[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [patternStatus, setPatternStatus] = useState<'idle' | 'success' | 'fail'>('idle');
    const gridRef = useRef<HTMLDivElement>(null);
    const [dots, setDots] = useState<{ id: number; x: number; y: number }[]>([]);
    
    // Facelock State
    const videoRef = useRef<HTMLVideoElement>(null);
    const [faceLockStatus, setFaceLockStatus] = useState<'idle' | 'verifying' | 'success' | 'fail'>('idle');
    const [cameraError, setCameraError] = useState<string | null>(null);

    // Effect to reset state when modal opens/operator changes
    useEffect(() => {
        if (show && operator) {
            setPinInput('');
            setPinStatus('idle');
            setPath([]);
            setPatternStatus('idle');
            setFaceLockStatus('idle');
            setCameraError(null);
            
            const dotPositions = [];
            for (let i = 0; i < 9; i++) {
                dotPositions.push({
                    id: i + 1,
                    x: (i % 3) * (GRID_SIZE / 3) + (GRID_SIZE / 6),
                    y: Math.floor(i / 3) * (GRID_SIZE / 3) + (GRID_SIZE / 6),
                });
            }
            setDots(dotPositions);
        }
    }, [show, operator]);

    // Camera Stream Logic
    useEffect(() => {
        let streamInstance: MediaStream | null = null;
        let active = true;
        
        const startCamera = async () => {
            if (operator?.faceLockCode && navigator.mediaDevices?.getUserMedia) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                    if (active) {
                        streamInstance = stream;
                        if (videoRef.current) {
                            videoRef.current.srcObject = stream;
                        }
                        setCameraError(null);
                    } else {
                        stream.getTracks().forEach(track => track.stop());
                    }
                } catch (err) {
                    if (active) setCameraError("Camera permission denied.");
                }
            }
        };

        if (show && operator?.faceLockCode) {
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
    }, [show, operator]);


    // PIN Logic
    const handleVerifyPin = () => {
        setPinStatus(pinInput === operator?.pin ? 'success' : 'fail');
        setTimeout(() => {
            setPinStatus('idle');
            setPinInput('');
        }, 2000);
    };

    // Pattern Logic
    const getDotFromCoordinates = (x: number, y: number) => {
        if (!gridRef.current) return null;
        const rect = gridRef.current.getBoundingClientRect();
        return dots.find(dot => {
            const dx = (x - rect.left) - dot.x;
            const dy = (y - rect.top) - dot.y;
            return Math.sqrt(dx * dx + dy * dy) < DOT_SIZE;
        });
    };
    const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setPath([]); setIsDrawing(true);
        const coords = 'touches' in e ? e.touches[0] : e;
        const dot = getDotFromCoordinates(coords.clientX, coords.clientY);
        if (dot) setPath([dot.id]);
    };
    const handleInteractionMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const coords = 'touches' in e ? e.touches[0] : e;
        const dot = getDotFromCoordinates(coords.clientX, coords.clientY);
        if (dot && !path.includes(dot.id)) setPath(prev => [...prev, dot.id]);
    };
    const handleInteractionEnd = () => {
        if (isDrawing) {
            setIsDrawing(false);
            if (path.length > 0) {
                const isMatch = operator?.patternLockCode && path.length === operator.patternLockCode.length && path.every((v, i) => v === operator.patternLockCode![i]);
                setPatternStatus(isMatch ? 'success' : 'fail');
                setTimeout(() => { setPatternStatus('idle'); setPath([]); }, 2000);
            }
        }
    };
    const renderLines = () => {
        const lines = [];
        for (let i = 0; i < path.length - 1; i++) {
            const startDot = dots.find(d => d.id === path[i]);
            const endDot = dots.find(d => d.id === path[i + 1]);
            if (startDot && endDot) {
                lines.push(<line key={`${startDot.id}-${endDot.id}`} x1={startDot.x} y1={startDot.y} x2={endDot.x} y2={endDot.y} stroke={LINE_COLOR} strokeWidth="4" />);
            }
        }
        return lines;
    };

    // Facelock Logic
    const handleVerifyFace = () => {
        setFaceLockStatus('verifying');
        setTimeout(() => {
            setFaceLockStatus('success'); // Simulate success
            setTimeout(() => setFaceLockStatus('idle'), 2000);
        }, 1500);
    };

    if (!show || !operator) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[80]">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-lg mx-auto w-full">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-xl font-bold text-indigo-700">Test Security for {operator.name}</h3>
                    <button onClick={onClose} className="p-1 text-gray-400 rounded-full hover:bg-gray-100"><XIcon /></button>
                </div>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {/* PIN Verifier */}
                    {operator.pin && (
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <div className="flex items-center gap-2 font-semibold mb-3"><KeyIcon /> PIN Verification</div>
                            <div className="flex gap-2 relative">
                                <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} maxLength={4} className="flex-grow p-2 border rounded-md" placeholder="Enter 4-digit PIN" disabled={pinStatus !== 'idle'} />
                                <button onClick={handleVerifyPin} disabled={pinStatus !== 'idle'} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">Verify</button>
                                {pinStatus === 'success' && <div className="absolute inset-0 bg-green-500 bg-opacity-75 flex items-center justify-center text-white font-bold rounded-md">Success!</div>}
                                {pinStatus === 'fail' && <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center text-white font-bold rounded-md">Failed</div>}
                            </div>
                        </div>
                    )}

                    {/* Pattern Verifier */}
                    {operator.patternLockCode && operator.patternLockCode.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg border">
                             <div className="flex items-center gap-2 font-semibold mb-3"><GridIcon /> Pattern Verification</div>
                             <div className="flex justify-center relative">
                                <div ref={gridRef} className="relative cursor-pointer touch-none bg-gray-100 rounded-lg" style={{ width: GRID_SIZE, height: GRID_SIZE }} onMouseDown={handleInteractionStart} onMouseMove={handleInteractionMove} onMouseUp={handleInteractionEnd} onMouseLeave={handleInteractionEnd} onTouchStart={handleInteractionStart} onTouchMove={handleInteractionMove} onTouchEnd={handleInteractionEnd}>
                                    <svg width={GRID_SIZE} height={GRID_SIZE} className="absolute top-0 left-0">
                                        {renderLines()}
                                    </svg>
                                    {dots.map(dot => (
                                        <div key={dot.id} className="absolute rounded-full flex items-center justify-center" style={{ width: DOT_SIZE * 2, height: DOT_SIZE * 2, top: dot.y - DOT_SIZE, left: dot.x - DOT_SIZE }}>
                                            <div className="rounded-full transition-colors" style={{ width: DOT_SIZE, height: DOT_SIZE, backgroundColor: path.includes(dot.id) ? DOT_ACTIVE_COLOR : DOT_COLOR }} />
                                        </div>
                                    ))}
                                </div>
                                {patternStatus === 'success' && <div className="absolute inset-0 bg-green-500 bg-opacity-75 flex items-center justify-center text-white font-bold rounded-lg">Success!</div>}
                                {patternStatus === 'fail' && <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center text-white font-bold rounded-lg">Failed</div>}
                             </div>
                        </div>
                    )}

                    {/* Facelock Verifier */}
                    {operator.faceLockCode && (
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <div className="flex items-center gap-2 font-semibold mb-3"><CameraIcon /> Facelock Verification</div>
                            {cameraError && <div className="p-2 bg-red-100 text-red-700 text-sm rounded-md mb-2">{cameraError}</div>}
                            <div className="relative w-full aspect-video bg-gray-200 rounded-md overflow-hidden mb-3">
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]"></video>
                                {faceLockStatus === 'verifying' && <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white">Verifying...</div>}
                                {faceLockStatus === 'success' && <div className="absolute inset-0 bg-green-500 bg-opacity-75 flex items-center justify-center text-white font-bold">Success!</div>}
                            </div>
                            <button onClick={handleVerifyFace} disabled={!!cameraError || faceLockStatus !== 'idle'} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">Test Facelock</button>
                        </div>
                    )}

                </div>
                 <div className="mt-4 pt-4 border-t flex justify-end">
                    <button onClick={onClose} className="px-5 py-2 border rounded-md text-gray-700 hover:bg-gray-100">Close</button>
                </div>
            </div>
        </div>
    );
};