'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { PhoneMockup } from './phone-mockup';

export function Phone3D({ screen, className = '' }: { screen?: 'accueil' | 'planning' | 'chat' | 'competition' | 'login'; className?: string }) {
  const elRef = useRef<HTMLDivElement>(null);
  const [rot, setRot] = useState({ x: 2, y: -4 });
  const [hover, setHover] = useState(false);
  const frameRef = useRef<number>(0);
  const target = useRef({ x: 2, y: -4 });
  const current = useRef({ x: 2, y: -4 });

  const onMove = useCallback((e: React.MouseEvent) => {
    const r = elRef.current?.getBoundingClientRect();
    if (!r) return;
    const cx = (e.clientX - r.left) / r.width - 0.5;
    const cy = (e.clientY - r.top) / r.height - 0.5;
    target.current = { x: cy * -12, y: cx * 14 };
  }, []);

  const onLeave = useCallback(() => {
    setHover(false);
    target.current = { x: 2, y: -4 };
  }, []);

  useEffect(() => {
    const t0 = Date.now();
    const tick = () => {
      const s = (Date.now() - t0) / 1000;
      if (!hover) {
        target.current = {
          x: 2 + Math.sin(s * 0.25) * 2.5,
          y: -4 + Math.cos(s * 0.18) * 3.5,
        };
      }
      current.current = {
        x: current.current.x + (target.current.x - current.current.x) * 0.07,
        y: current.current.y + (target.current.y - current.current.y) * 0.07,
      };
      setRot(current.current);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [hover]);

  const shadowX = rot.y * 0.6;
  const shadowY = rot.x * 0.6;

  return (
    <div className={className}>
      <div
        ref={elRef}
        onMouseMove={onMove}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={onLeave}
        className="mx-auto"
        style={{ width: 300, height: 600 }}
      >
        <div
          className="w-full h-full relative"
          style={{
            transform: `perspective(900px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
            transformStyle: 'preserve-3d',
            transformOrigin: 'center center',
            willChange: 'transform',
          }}
        >
          {/* Phone frame */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              borderRadius: 44,
              background: 'linear-gradient(145deg, #3d3d3d 0%, #1a1a1a 40%, #111 100%)',
              border: '1.5px solid #555',
              boxShadow: `
                inset 0 0 0 3px #0a0a0a,
                ${shadowX}px ${shadowY + 16}px 40px rgba(0,0,0,0.35)
              `,
              transform: 'translateZ(10px)',
            }}
          >
            <PhoneMockup screen={screen} />
          </div>

          {/* Side buttons */}
          <div className="absolute" style={{ right: -5, top: 118, width: 4, height: 48, borderRadius: '0 2px 2px 0', background: 'linear-gradient(to right, #333, #222)' }} />
          <div className="absolute" style={{ right: -5, top: 184, width: 4, height: 32, borderRadius: '0 2px 2px 0', background: 'linear-gradient(to right, #333, #222)' }} />
        </div>
      </div>
    </div>
  );
}
