import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { AppState, GestureType, HandLandmark } from './types';
import { DEFAULT_PHOTOS } from './constants';
import { detectGesture } from './utils/gestureLogic';
import Interface from './components/UI/Interface';
import Watchdog from './components/UI/Watchdog';

// Lazy load Experience to isolate 3D dependency issues
const Experience = React.lazy(() => 
  import('./components/Scene/Experience').then(module => ({ default: module.Experience }))
);

// Type for log entries
interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.TREE);
  const [currentGesture, setCurrentGesture] = useState<GestureType>('NONE');
  const [photos, setPhotos] = useState<string[]>(DEFAULT_PHOTOS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0); // 0 to 100
  
  // Watchdog Logs State
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const handLandmarkerRef = useRef<any>(null);
  const handLandmarksRef = useRef<HandLandmark[] | null>(null);
  const requestRef = useRef<number>();

  // --- Logger Helper ---
  const addLog = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      timestamp,
      message,
      type
    }]);
  }, []);

  // --- Global Error Handler ---
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      addLog(event.message, 'error');
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      addLog(`Unhandled Promise: ${event.reason}`, 'error');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    // Initial log
    addLog("System starting...", "info");

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [addLog]);

  // --- Photo Upload ---
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addLog(`Uploading ${e.target.files.length} new memories...`, 'info');
      const newPhotos: string[] = [];
      Array.from(e.target.files).forEach((file: any) => {
        newPhotos.push(URL.createObjectURL(file));
      });
      setPhotos(prev => [...newPhotos, ...prev]);
      addLog(`Photos added successfully.`, 'success');
    }
  };

  // --- MediaPipe Setup ---
  useEffect(() => {
    let mounted = true;

    const initMediaPipe = async () => {
      addLog("Initializing Holiday Magic OS...", 'info');
      setLoadingProgress(5);

      try {
        addLog("Loading Vision Library...", 'info');
        // Dynamic import to prevent top-level await/import blocking
        const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');

        addLog("Loading Vision Tasks (WASM)...", 'info');
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        setLoadingProgress(30);
        
        addLog("Creating Hand Landmarker Model...", 'info');
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        setLoadingProgress(60);
        addLog("AI Model Loaded Successfully.", 'success');
        if (mounted) startWebcam();
      } catch (error: any) {
        console.error("Error initializing MediaPipe:", error);
        addLog(`Init Failed: ${error.message || error}`, 'error');
      }
    };

    // Delay init slightly to allow UI to paint
    setTimeout(initMediaPipe, 100);
    
    return () => {
       mounted = false;
       if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, [addLog]);

  const startWebcam = async () => {
    addLog("Requesting Camera Access...", 'info');
    setLoadingProgress(70);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', () => {
          addLog("Webcam stream active.", 'success');
          setLoadingProgress(90);
          
          addLog("Starting prediction loop...", 'info');
          predictWebcam();
          
          // Complete loading
          setLoadingProgress(100);
          setTimeout(() => {
              setIsLoading(false);
          }, 800); // Small delay to let user see 100%
        });
      }
    } catch (err: any) {
      console.error("Webcam denied:", err);
      addLog(`Camera Error: ${err.message || "Permission Denied"}`, 'error');
    }
  };

  // --- Loop ---
  const predictWebcam = () => {
    if (!handLandmarkerRef.current || !videoRef.current) return;

    const nowInMs = Date.now();
    try {
        const results = handLandmarkerRef.current.detectForVideo(videoRef.current, nowInMs);

        if (results.landmarks && results.landmarks.length > 0) {
        handLandmarksRef.current = results.landmarks[0] as unknown as HandLandmark[];
        
        const gesture = detectGesture(handLandmarksRef.current);
        
        if (gesture !== currentGesture) {
            setCurrentGesture(gesture);
        }

        // State Machine Logic
        if (gesture === 'FIST') {
            setAppState(prev => prev !== AppState.TREE ? AppState.TREE : prev);
        } else if (gesture === 'OPEN_PALM') {
            setAppState(prev => prev !== AppState.SCATTER ? AppState.SCATTER : prev);
        } else if (gesture === 'PINCH') {
            setAppState(prev => prev !== AppState.ZOOM ? AppState.ZOOM : prev);
        }
        } else {
            handLandmarksRef.current = null;
            if (currentGesture !== 'NONE') setCurrentGesture('NONE');
        }
    } catch (e: any) {
        // Don't log every frame error to avoid freezing, but print to console
        console.warn("Prediction error", e);
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Hidden Video for CV */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="absolute top-0 left-0 opacity-0 pointer-events-none w-1 h-1"
      />

      {/* Main 3D Experience - Lazy Loaded */}
      <Suspense fallback={null}>
        <Experience 
          appState={appState} 
          photos={photos} 
          handLandmarksRef={handLandmarksRef}
        />
      </Suspense>

      {/* UI Overlay */}
      <Interface 
        appState={appState} 
        gesture={currentGesture} 
        onUpload={handleUpload}
        isLoading={isLoading}
      />

      {/* Watchdog Terminal - Only visible during initialization */}
      {isLoading && <Watchdog logs={logs} />}
      
      {/* Loading Overlay */}
      {isLoading && (
         <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center p-8">
            <div className="max-w-md w-full text-center space-y-6">
              
              {/* Logo / Spinner */}
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-yellow-500">
                   {loadingProgress}%
                </div>
              </div>

              {/* Text */}
              <div>
                <h2 className="text-2xl font-serif text-yellow-500 tracking-widest uppercase">Initializing Magic</h2>
                <p className="text-sm text-gray-500 font-mono mt-2 animate-pulse">
                   Setting up neural networks & 3D environment...
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-900 rounded-full h-3 border border-white/10 overflow-hidden relative">
                 {/* Moving Stripes Pattern */}
                 <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[pulse_1s_ease-in-out_infinite]"></div>
                 
                 {/* Bar Fill */}
                 <div 
                    className="h-full bg-gradient-to-r from-yellow-700 to-yellow-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,215,0,0.5)]"
                    style={{ width: `${loadingProgress}%` }}
                 ></div>
              </div>

            </div>
         </div>
      )}
    </div>
  );
};

export default App;