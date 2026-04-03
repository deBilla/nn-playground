import { useRef, useEffect } from 'react';
import { useNNStore } from '../../stores/nnStore';

const SIZE = 200;

export function DecisionBoundary() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { network, dataPoints, epoch } = useNNStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !network) return;

    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(SIZE, SIZE);

    for (let py = 0; py < SIZE; py++) {
      for (let px = 0; px < SIZE; px++) {
        const x = (px / SIZE) * 2 - 1;
        const y = (py / SIZE) * 2 - 1;
        const output = network.forward([x, y])[0];
        const idx = (py * SIZE + px) * 4;

        const t = Math.max(0, Math.min(1, output));
        imgData.data[idx] = Math.round(59 + (249 - 59) * t);
        imgData.data[idx + 1] = Math.round(130 + (115 - 130) * t);
        imgData.data[idx + 2] = Math.round(246 + (22 - 246) * t);
        imgData.data[idx + 3] = 180;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    for (const p of dataPoints) {
      const px = ((p.x + 1) / 2) * SIZE;
      const py = ((p.y + 1) / 2) * SIZE;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = p.label === 1 ? '#f97316' : '#3b82f6';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 0.5;
      ctx.fill();
      ctx.stroke();
    }
  }, [network, dataPoints, epoch]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xs font-medium text-slate-500">Decision Boundary</h3>
        <span className="text-[10px] text-slate-600">
          — how the network classifies every point in 2D space
        </span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className="rounded border border-slate-700"
          style={{ imageRendering: 'pixelated', width: '100%', maxWidth: SIZE, maxHeight: '100%', aspectRatio: '1' }}
        />
      </div>
    </div>
  );
}
