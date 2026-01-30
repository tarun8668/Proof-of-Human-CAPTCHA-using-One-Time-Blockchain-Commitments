
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MovementPoint, CaptchaMode, CaptchaDifficulty } from '../types';

interface CaptchaCanvasProps {
  onComplete: (movements: MovementPoint[]) => void;
  disabled: boolean;
  mode: CaptchaMode;
  difficulty: CaptchaDifficulty;
}

const CaptchaCanvas: React.FC<CaptchaCanvasProps> = ({ onComplete, disabled, mode, difficulty }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [movements, setMovements] = useState<MovementPoint[]>([]);
  const startTimestamp = useRef<number>(0);
  const [sequenceTarget, setSequenceTarget] = useState<number>(0); // Next number to click
  const [sequencePoints, setSequencePoints] = useState<{x: number, y: number, r: number, val: number}[]>([]);
  const [mathProblem, setMathProblem] = useState<{question: string, options: {x: number, y: number, val: string, isCorrect: boolean}[]} | null>(null);
  const [sliderPosition, setSliderPosition] = useState(0);

  // Reset state when mode/difficulty changes
  useEffect(() => {
    setSequencePoints([]);
    setMathProblem(null);
    setSliderPosition(0);
    setSequenceTarget(0);
    setMovements([]);
    
    // Force a redraw
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, 400, 200);
    }
  }, [mode, difficulty]);

  // Main Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ensure scaling is set once or handled correctly
    // (Ideally move scaling to a separate init effect, but for now just ensure width matches)
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * devicePixelRatio) {
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        ctx.scale(devicePixelRatio, devicePixelRatio);
    }

    drawScene(ctx);

  }, [mode, difficulty, sequenceTarget, sliderPosition, sequencePoints, mathProblem]);

  const drawScene = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, 400, 200);

    if (mode === 'trace') {
        // Draw a ghost path for the user to follow
        ctx.strokeStyle = '#334155';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        if (difficulty === 'easy') {
            ctx.moveTo(50, 100);
            ctx.bezierCurveTo(150, 20, 250, 180, 350, 100);
        } else if (difficulty === 'medium') {
            ctx.moveTo(30, 150);
            ctx.bezierCurveTo(100, 20, 200, 180, 300, 20);
            ctx.lineTo(370, 150);
        } else {
            ctx.moveTo(20, 100);
            ctx.arc(200, 100, 50, Math.PI, 0); 
            ctx.bezierCurveTo(280, 150, 320, 50, 380, 100);
        }
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter';
        ctx.fillText('Trace the line', 50, 180);
    } 
    else if (mode === 'sequence') {
        if (sequencePoints.length === 0) {
            // Generate points
            const count = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7;
            const newPoints = [];
            for (let i = 1; i <= count; i++) {
                newPoints.push({
                    x: 50 + Math.random() * 300,
                    y: 30 + Math.random() * 140,
                    r: 15,
                    val: i
                });
            }
            setSequencePoints(newPoints);
            return; // Will re-render
        }

        sequencePoints.forEach(p => {
            if (p.val < sequenceTarget + 1) {
                ctx.fillStyle = '#10b981'; // Completed
            } else {
                ctx.fillStyle = '#334155';
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.val.toString(), p.x, p.y);
        });

        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'left';
        ctx.fillText(`Click numbers in order: ${sequenceTarget + 1}`, 20, 190);
    }
    else if (mode === 'math') {
        if (!mathProblem) {
            // Generate simple math problem
            const a = Math.floor(Math.random() * 10);
            const b = Math.floor(Math.random() * 10);
            const ans = a + b;
            const opts = [
                { val: ans.toString(), isCorrect: true, x: 100, y: 100 },
                { val: (ans + 1).toString(), isCorrect: false, x: 200, y: 100 },
                { val: (ans - 1).toString(), isCorrect: false, x: 300, y: 100 }
            ].sort(() => Math.random() - 0.5);

            // Re-assign positions after shuffle
            opts[0].x = 80; opts[1].x = 200; opts[2].x = 320;

            setMathProblem({ question: `${a} + ${b} = ?`, options: opts });
            return;
        }

        ctx.fillStyle = '#fff';
        ctx.font = '24px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(mathProblem.question, 200, 50);

        mathProblem.options.forEach(opt => {
            ctx.fillStyle = '#334155';
            ctx.fillRect(opt.x - 30, opt.y - 20, 60, 40);
            ctx.fillStyle = '#fff';
            ctx.font = '18px Inter';
            ctx.fillText(opt.val, opt.x, opt.y + 5);
        });
    }
    else if (mode === 'slider') {
        // Draw track
        ctx.fillStyle = '#334155';
        ctx.fillRect(50, 95, 300, 10);

        // Target zone
        ctx.fillStyle = '#10b98133'; // transparent green
        const targetX = difficulty === 'easy' ? 250 : difficulty === 'medium' ? 300 : 330;
        ctx.fillRect(targetX - 10, 85, 20, 30);

        // Handle
        const handleX = 50 + sliderPosition;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(handleX, 100, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#64748b';
        ctx.fillText('Slide to the green zone', 50, 150);
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number, y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    setIsInteracting(true);
    setMovements([]); // Reset for new attempt
    startTimestamp.current = Date.now();
    const { x, y } = getCoordinates(e);
    setMovements([{ x, y, t: 0, type: 'click' }]);
    
    // Logic for Sequence/Math/Slider clicks
    if (mode === 'sequence') {
        const clicked = sequencePoints.find(p => Math.hypot(p.x - x, p.y - y) < p.r + 5);
        if (clicked && clicked.val === sequenceTarget + 1) {
            setSequenceTarget(prev => prev + 1);
            if (clicked.val === sequencePoints.length) {
                // Done
                setTimeout(() => onComplete([...movements, {x, y, t: Date.now() - startTimestamp.current, type: 'click'}]), 500);
            }
        }
    } else if (mode === 'math' && mathProblem) {
        const clicked = mathProblem.options.find(opt => 
            x > opt.x - 30 && x < opt.x + 30 && y > opt.y - 20 && y < opt.y + 20
        );
        if (clicked && clicked.isCorrect) {
            onComplete([...movements, {x, y, t: Date.now() - startTimestamp.current, type: 'click'}]);
        }
    } else if (mode === 'slider') {
         // Check if clicked on handle
         if (Math.abs(x - 50) < 20 && Math.abs(y - 100) < 20) {
             // Started dragging slider
         }
    } else if (mode === 'trace') {
        // Redraw only for trace
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx) {
             drawScene(ctx); // clear and redraw base
             ctx.strokeStyle = '#38bdf8';
             ctx.lineWidth = 4;
             ctx.lineCap = 'round';
             ctx.beginPath();
             ctx.moveTo(x, y);
        }
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isInteracting || disabled) return;
    const { x, y } = getCoordinates(e);
    const t = Date.now() - startTimestamp.current;
    setMovements(prev => [...prev, { x, y, t, type: 'move' }]);

    if (mode === 'slider') {
        // Constrain to track
        let newX = Math.max(0, Math.min(300, x - 50));
        setSliderPosition(newX);
    } else if (mode === 'trace') {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx) {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }
  };

  const handleEnd = () => {
    if (!isInteracting || disabled) return;
    setIsInteracting(false);
    
    if (mode === 'trace') {
        if (movements.length > 20) {
            onComplete(movements);
        }
    } else if (mode === 'slider') {
        const targetX = difficulty === 'easy' ? 250 : difficulty === 'medium' ? 300 : 330;
        // 50 base offset + sliderPosition vs Target
        // Actually targetX is absolute. Handle is at 50 + sliderPosition.
        const currentHandleX = 50 + sliderPosition;
        
        if (Math.abs(currentHandleX - targetX) < 15) {
            onComplete(movements);
        } else {
             // Reset
             setSliderPosition(0);
        }
    }
  };

  return (
    <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-inner group">
      <canvas
        ref={canvasRef}
        className={`w-full h-48 block cursor-crosshair transition-opacity duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
        style={{ width: '400px', height: '200px' }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
      {disabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px]">
          <span className="text-slate-400 font-medium">Processing...</span>
        </div>
      )}
    </div>
  );
};

export default CaptchaCanvas;
