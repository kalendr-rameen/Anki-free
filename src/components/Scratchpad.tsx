import React, { useRef, useState, useEffect } from 'react';
import { Eraser, RotateCcw, X, Palette, Maximize2, Minimize2 } from 'lucide-react';

interface ScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export const Scratchpad: React.FC<ScratchpadProps> = ({ isOpen, onClose, isDark }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [color, setColor] = useState<string>(isDark ? '#FFFFFF' : '#007AFF');
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    setColor(isDark ? '#FFFFFF' : '#007AFF');
  }, [isDark]);

  // Resize canvas according to client dimensions
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth * window.devicePixelRatio;
      canvas.height = parent.clientHeight * window.devicePixelRatio;
      redraw(strokes);
    }
  }, [isOpen, isExpanded]);

  const redraw = (allStrokes: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of allStrokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newStroke: Stroke = {
      points: [{ x, y }],
      color,
      width: lineWidth,
    };
    setCurrentStroke(newStroke);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!currentStroke) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, { x, y }],
    };
    setCurrentStroke(updatedStroke);
    redraw([...strokes, updatedStroke]);
  };

  const handlePointerUp = () => {
    if (!currentStroke) return;
    const updated = [...strokes, currentStroke];
    setStrokes(updated);
    setCurrentStroke(null);
  };

  const handleClear = () => {
    setStrokes([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const updated = strokes.slice(0, -1);
    setStrokes(updated);
    redraw(updated);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed transition-all duration-300 z-30 flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl ${
        isExpanded
          ? 'inset-3 md:inset-10'
          : 'bottom-24 right-4 left-4 md:left-auto md:w-96 h-64'
      }`}
      style={{ touchAction: 'none' }}
    >
      {/* Scratchpad Header / Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-800/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Apple Pencil Scratchpad
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            {['#007AFF', '#FF3B30', '#34C759', '#FF9500', isDark ? '#FFFFFF' : '#000000'].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-5 h-5 rounded-full border border-black/10 transition-transform ${
                  color === c ? 'scale-125 ring-2 ring-ios-blue ring-offset-1' : 'opacity-70'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            title="Undo stroke"
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 ios-touch-active"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            title="Clear whiteboard"
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 ios-touch-active"
          >
            <Eraser className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Minimize' : 'Expand'}
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 ios-touch-active"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            title="Close"
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 ios-touch-active"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Drawing Area */}
      <div className="relative flex-1 w-full h-full bg-transparent">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full cursor-crosshair"
          style={{ width: '100%', height: '100%', touchAction: 'none' }}
        />
        {strokes.length === 0 && !currentStroke && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-neutral-400 dark:text-neutral-600 text-sm italic select-none">
            Write or sketch your answer here before flipping...
          </div>
        )}
      </div>
    </div>
  );
};
