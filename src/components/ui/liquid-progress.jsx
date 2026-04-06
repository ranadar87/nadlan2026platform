import React from 'react';

export default function LiquidProgress({ value = 0 }) {
  return (
    <div className="relative w-full h-3 bg-secondary rounded-full overflow-hidden">
      <style>{`
        @keyframes liquidWave {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(100%); }
        }
        .liquid-fill {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          background: linear-gradient(90deg, hsl(248, 80%, 60%), hsl(168, 80%, 50%));
          transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          border-radius: 999px;
          overflow: hidden;
        }
        .liquid-wave {
          position: absolute;
          width: 200%;
          height: 100%;
          background: repeating-linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.1) 0px,
            rgba(255, 255, 255, 0.1) 10px,
            transparent 10px,
            transparent 20px
          );
          animation: liquidWave 2s linear infinite;
        }
      `}</style>
      <div className="liquid-fill" style={{ width: `${Math.min(value, 100)}%` }}>
        <div className="liquid-wave" />
      </div>
    </div>
  );
}