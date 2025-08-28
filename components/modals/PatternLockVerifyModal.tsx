import React, { useState, useRef, useEffect } from 'react';

interface PatternLockVerifyModalProps {
    show: boolean;
    onClose: () => void;
    onVerify: (pattern: number[]) => void;
}

const DOT_SIZE = 20;
const GRID_SIZE = 300;
const DOT_COLOR = '#9ca3af'; // gray-400
const DOT_ACTIVE_COLOR = '#4f46e5'; // indigo-600
const LINE_COLOR = '#6366f1'; // indigo-500

export const PatternLockVerifyModal: React.FC<PatternLockVerifyModalProps> = ({ show, onClose, onVerify }) => {
    const [path, setPath] = useState<number[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
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
            setPath([]);
            setIsDrawing(false);
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
            if (path.length > 0) {
                onVerify(path);
                setPath([]); // Reset for next attempt
            }
        }
    };

    if (!show) return null;

    const renderLines = () => {
        const lines = [];
        for (let i = 0; i < path.length - 1; i++) {
            const startDot = dots.find(d => d.id === path[i]);
            const endDot = dots.find(d => d.id === path[i + 1]);
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Draw Pattern to Unlock</h3>
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
                            className="absolute rounded-full flex items-center justify-center"
                            style={{
                                width: DOT_SIZE * 2, height: DOT_SIZE * 2,
                                top: dot.y - DOT_SIZE, left: dot.x - DOT_SIZE,
                            }}
                        >
                            <div
                                className="rounded-full transition-colors"
                                style={{
                                    width: DOT_SIZE, height: DOT_SIZE,
                                    backgroundColor: path.includes(dot.id) ? DOT_ACTIVE_COLOR : DOT_COLOR,
                                }}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-4">
                     <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};