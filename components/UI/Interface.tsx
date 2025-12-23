import React from 'react';
import { AppState, GestureType } from '../../types';

interface InterfaceProps {
  appState: AppState;
  gesture: GestureType;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
}

const Interface: React.FC<InterfaceProps> = ({ appState, gesture, onUpload, isLoading }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="serif text-4xl text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
            Holiday Magic
          </h1>
          <p className="text-gray-300 text-sm mt-2 opacity-80 max-w-md">
            Control the tree with your hands. Use gestures to interact with the magic.
          </p>
        </div>
        
        {/* Status Badge */}
        <div className="flex flex-col items-end gap-2">
           <div className={`px-4 py-2 rounded-full border border-white/20 backdrop-blur-md transition-colors duration-300 ${
             gesture !== 'NONE' ? 'bg-yellow-500/20 text-yellow-200' : 'bg-white/10 text-gray-400'
           }`}>
             <span className="uppercase text-xs tracking-widest font-bold">
               {isLoading ? 'Loading AI...' : `Gesture: ${gesture}`}
             </span>
           </div>
           <div className="px-4 py-1 rounded-full bg-white/5 border border-white/10">
              <span className="text-xs text-gray-400">Mode: {appState}</span>
           </div>
        </div>
      </div>

      {/* Upload & Controls */}
      <div className="flex flex-col gap-4 pointer-events-auto items-start">
         <label className="group cursor-pointer flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md px-6 py-3 rounded-xl transition-all duration-300">
            <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-lg group-hover:scale-110 transition-transform">
              +
            </div>
            <div className="flex flex-col">
               <span className="font-semibold text-sm text-yellow-100">Add Memories</span>
               <span className="text-[10px] text-gray-400">Upload photos to the cloud</span>
            </div>
            <input type="file" accept="image/*" multiple onChange={onUpload} className="hidden" />
         </label>
      </div>

      {/* Instructions Footer */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <InstructionCard 
          title="Fist" 
          desc="Close the tree" 
          active={gesture === 'FIST'} 
        />
        <InstructionCard 
          title="Open Hand" 
          desc="Scatter magic" 
          active={gesture === 'OPEN_PALM'} 
        />
        <InstructionCard 
          title="Pinch" 
          desc="Grab a memory" 
          active={gesture === 'PINCH'} 
        />
      </div>
    </div>
  );
};

const InstructionCard: React.FC<{ title: string; desc: string; active: boolean }> = ({ title, desc, active }) => (
  <div className={`
    rounded-lg p-4 transition-all duration-500 border
    ${active 
      ? 'bg-gradient-to-t from-yellow-900/50 to-transparent border-yellow-500/50 scale-105 shadow-[0_0_20px_rgba(255,215,0,0.2)]' 
      : 'bg-black/40 border-white/5 opacity-50'}
  `}>
    <h3 className={`serif text-lg ${active ? 'text-yellow-400' : 'text-gray-400'}`}>{title}</h3>
    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{desc}</p>
  </div>
);

export default Interface;
