import React, { useEffect, useRef } from 'react';

interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

interface WatchdogProps {
  logs: LogEntry[];
}

const Watchdog: React.FC<WatchdogProps> = ({ logs }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="absolute bottom-4 left-4 z-[100] w-80 max-h-48 flex flex-col font-mono text-xs pointer-events-auto">
      <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-t-md p-2 flex justify-between items-center">
        <span className="text-yellow-500 font-bold uppercase tracking-wider">System Watchdog</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
      </div>
      <div 
        ref={containerRef}
        className="bg-black/60 border-x border-b border-white/10 rounded-b-md p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
        style={{ height: '150px' }}
      >
        {logs.length === 0 && <span className="text-gray-600 italic">Waiting for events...</span>}
        
        {logs.map((log) => (
          <div key={log.id} className="mb-1 leading-tight break-words">
            <span className="text-gray-500 mr-2">[{log.timestamp}]</span>
            <span className={`
              ${log.type === 'error' ? 'text-red-400 font-bold' : ''}
              ${log.type === 'success' ? 'text-green-400' : ''}
              ${log.type === 'info' ? 'text-gray-300' : ''}
            `}>
              {log.type === 'error' ? 'ERR: ' : '> '}
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Watchdog;