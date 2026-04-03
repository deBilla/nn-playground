import { useState, useRef, useCallback } from 'react';

export function useCanvasRecorder(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    chunksRef.current = [];
    const stream = canvas.captureStream(30); // 30fps
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fight-club-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };

    recorderRef.current = recorder;
    recorder.start(100); // collect data every 100ms
    setIsRecording(true);
  }, [canvasRef]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setIsRecording(false);
  }, []);

  return { isRecording, startRecording, stopRecording };
}
