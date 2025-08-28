import React, { useState, useRef, useEffect } from 'react';
import { CheckIcon, XIcon } from '../Icons';

interface PatternLockModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (pattern: number[]) => void;
}

const DOT_SIZE = 20;
const GRID_SIZE = 300;
const DOT_COLOR = '#9ca3af'; // gray-400
const DOT_ACTIVE_COLOR = '#4f46e5'; // indigo-600
const LINE_COLOR = '#6366f1'; // indigo-500

export const PatternLockModal: React.FC<PatternLockModalProps> = ({ show, onClose, onSave }) => {
    const [path, setPath] = useState<number[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [finalPattern, setFinalPattern] = useState<number[] | null>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const [dots, setDots] = useState<{ id: number; x: number; y: number }[]>([]);

    useEffect(() => {
        if (show) {
            const dotPositions = [];
            for (let i = 0; i < 9; i++) {
                dotPositions.push({
                    id: i + 1,
                    x: (i % 3) * (GRID_SIZE / 3) + (GRID_SIZE / 6),
                    y: Math.floor(i / 3) * (GRID_SIZE / 3) + (GRID_SIZE / 6),
                });
            }
            setDots(dotPositions);
        } else {
            // Reset state on close
            setPath([]);
            setIsDrawing(false);
            setFinalPattern(null);
        }
    }, [show]);

    const getDotFromCoordinates = (x: number, y: number) => {
        if (!gridRef.current) return null;
        const rect = gridRef.current.getBoundingClientRect();
        const relativeX = x - rect.left;
        const relativeY = y - rect.top;

        return dots.find(dot => {
            const dx = relativeX - dot.x;
            const dy = relativeY - dot.y;
            return Math.sqrt(dx * dx + dy * dy) < DOT_SIZE;
        });
    };

    const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setFinalPattern(null);
        setPath([]);
        setIsDrawing(true);
        const coords = 'touches' in e ? e.touches[0] : e;
        const dot = getDotFromCoordinates(coords.clientX, coords.clientY);
        if (dot) {
            setPath([dot.id]);
        }
    };
    
    const handleInteractionMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const coords = 'touches' in e ? e.touches[0] : e;
        const dot = getDotFromCoordinates(coords.clientX, coords.clientY);
        if (dot && !path.includes(dot.id)) {
            setPath(prev => [...prev, dot.id]);
        }
    };

    const handleInteractionEnd = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (isDrawing) {
            setIsDrawing(false);
            if (path.length > 2) {
                setFinalPattern(path);
            } else {
                setPath([]); // Invalid pattern, clear it
            }
        }
    };

    const handleSave = () => {
        if (finalPattern) {
            onSave(finalPattern);
        }
    };

    const handleRetry = () => {
        setFinalPattern(null);
        setPath([]);
    };

    if (!show) return null;

    const renderLines = () => {
        const lines = [];
        const currentPath = finalPattern || path;
        for (let i = 0; i < currentPath.length - 1; i++) {
            const startDot = dots.find(d => d.id === currentPath[i]);
            const endDot = dots.find(d => d.id === currentPath[i + 1]);
            if (startDot && endDot) {
                lines.push(
                    <line
                        key={`${startDot.id}-${endDot.id}`}
                        x1={startDot.x} y1={startDot.y}
                        x2={endDot.x} y2={endDot.y}
                        stroke={LINE_COLOR} strokeWidth="4"
                    />
                );
            }
        }
        return lines;
    };
    
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[80]">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Setup Pattern Lock</h3>
                <p className="text-sm text-gray-500 mb-4 text-center">
                    {finalPattern ? "Pattern set. Save or retry." : "Connect at least 3 dots."}
                </p>
                <div
                    ref={gridRef}
                    className="relative cursor-pointer touch-none bg-gray-100 rounded-lg"
                    style={{ width: GRID_SIZE, height: GRID_SIZE }}
                    onMouseDown={handleInteractionStart}
                    onMouseMove={handleInteractionMove}
                    onMouseUp={handleInteractionEnd}
                    onMouseLeave={handleInteractionEnd}
                    onTouchStart={handleInteractionStart}
                    onTouchMove={handleInteractionMove}
                    onTouchEnd={handleInteractionEnd}
                >
                    <svg width={GRID_SIZE} height={GRID_SIZE} className="absolute top-0 left-0">
                        {renderLines()}
                    </svg>
                    {dots.map(dot => (
                        <div
                            key={dot.id}
                            className="absolute rounded-full"
                            style={{
                                width: DOT_SIZE * 2,
                                height: DOT_SIZE * 2,
                                top: dot.y - DOT_SIZE,
                                left: dot.x - DOT_SIZE,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <div
                                className="rounded-full transition-colors"
                                style={{
                                    width: DOT_SIZE,
                                    height: DOT_SIZE,
                                    backgroundColor: (finalPattern || path).includes(dot.id) ? DOT_ACTIVE_COLOR : DOT_COLOR,
                                }}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-between items-center space-x-4 mt-4">
                     <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">
                        Cancel
                    </button>
                    <div className="flex space-x-2">
                         <button onClick={handleRetry} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600">
                            Retry
                        </button>
                         <button 
                            onClick={handleSave}
                            disabled={!finalPattern}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-1"
                        >
                            <CheckIcon /> Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};