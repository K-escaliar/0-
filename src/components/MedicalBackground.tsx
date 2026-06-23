'use client'

/**
 * Fundo animado com tema médico.
 * - variant="hero": fundo azul intenso (tela de login) com ECG, cruzes e brilhos.
 * - variant="subtle": versão clara e discreta para o fundo do dashboard.
 *
 * Tudo em CSS/SVG puro (sem dependências) e com `pointer-events-none`,
 * então fica totalmente atrás do conteúdo sem atrapalhar cliques.
 */
export default function MedicalBackground({
  variant = 'hero',
}: {
  variant?: 'hero' | 'subtle'
}) {
  const subtle = variant === 'subtle'

  return (
    <div className="medbg" aria-hidden="true">
      {!subtle && <div className="medbg-base" />}

      {/* Brilhos pulsando */}
      <div className="medbg-glow medbg-glow-1" />
      <div className="medbg-glow medbg-glow-2" />
      <div className="medbg-glow medbg-glow-3" />

      {/* Linha de ECG / batimento cardíaco rolando */}
      <svg
        className="medbg-ecg"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="ecgFade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className="medbg-ecg-path"
          d="M0,100 L200,100 L230,100 L245,60 L260,140 L275,40 L290,160 L305,100 L340,100 L600,100 L630,100 L645,60 L660,140 L675,40 L690,160 L705,100 L740,100 L1000,100 L1030,100 L1045,60 L1060,140 L1075,40 L1090,160 L1105,100 L1140,100 L1200,100"
          fill="none"
          stroke="url(#ecgFade)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Cruzes médicas flutuando */}
      <div className="medbg-cross medbg-cross-1">+</div>
      <div className="medbg-cross medbg-cross-2">+</div>
      <div className="medbg-cross medbg-cross-3">+</div>
      <div className="medbg-cross medbg-cross-4">+</div>
      <div className="medbg-cross medbg-cross-5">+</div>
      <div className="medbg-cross medbg-cross-6">+</div>
      <div className="medbg-cross medbg-cross-7">+</div>

      <style jsx>{`
        .medbg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
          color: ${subtle ? 'rgba(37, 99, 235, 0.45)' : 'rgba(147, 197, 253, 0.9)'};
        }

        .medbg-base {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 20%, #1e3a8a 0%, transparent 55%),
            radial-gradient(circle at 80% 70%, #1d4ed8 0%, transparent 55%),
            linear-gradient(135deg, #0f1f4b 0%, #16357e 50%, #1e40af 100%);
        }

        /* ----- Brilhos pulsantes ----- */
        .medbg-glow {
          position: absolute;
          border-radius: 9999px;
          filter: blur(60px);
          opacity: ${subtle ? 0.15 : 0.4};
          animation: medbg-pulse 9s ease-in-out infinite;
        }
        .medbg-glow-1 {
          width: 380px;
          height: 380px;
          top: -80px;
          left: -60px;
          background: ${subtle ? '#93c5fd' : '#3b82f6'};
        }
        .medbg-glow-2 {
          width: 460px;
          height: 460px;
          bottom: -140px;
          right: -100px;
          background: ${subtle ? '#a5f3fc' : '#22d3ee'};
          animation-delay: 3s;
        }
        .medbg-glow-3 {
          width: 300px;
          height: 300px;
          top: 40%;
          left: 55%;
          background: ${subtle ? '#bfdbfe' : '#60a5fa'};
          animation-delay: 6s;
        }
        @keyframes medbg-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: ${subtle ? 0.1 : 0.3};
          }
          50% {
            transform: scale(1.25);
            opacity: ${subtle ? 0.22 : 0.5};
          }
        }

        /* ----- ECG ----- */
        .medbg-ecg {
          position: absolute;
          left: 0;
          top: 50%;
          width: 200%;
          height: 220px;
          transform: translateY(-50%);
          opacity: ${subtle ? 0.5 : 0.8};
          animation: medbg-scroll 12s linear infinite;
        }
        .medbg-ecg-path {
          filter: drop-shadow(0 0 6px currentColor);
        }
        @keyframes medbg-scroll {
          from {
            transform: translate(0, -50%);
          }
          to {
            transform: translate(-50%, -50%);
          }
        }

        /* ----- Cruzes flutuantes ----- */
        .medbg-cross {
          position: absolute;
          font-weight: 700;
          line-height: 1;
          color: currentColor;
          opacity: 0;
          animation: medbg-float 16s ease-in-out infinite;
          user-select: none;
        }
        .medbg-cross-1 {
          left: 8%;
          font-size: 42px;
          animation-delay: 0s;
        }
        .medbg-cross-2 {
          left: 22%;
          font-size: 26px;
          animation-delay: 5s;
        }
        .medbg-cross-3 {
          left: 38%;
          font-size: 60px;
          animation-delay: 9s;
        }
        .medbg-cross-4 {
          left: 55%;
          font-size: 30px;
          animation-delay: 2s;
        }
        .medbg-cross-5 {
          left: 70%;
          font-size: 48px;
          animation-delay: 7s;
        }
        .medbg-cross-6 {
          left: 83%;
          font-size: 24px;
          animation-delay: 11s;
        }
        .medbg-cross-7 {
          left: 92%;
          font-size: 38px;
          animation-delay: 13s;
        }
        @keyframes medbg-float {
          0% {
            transform: translateY(110vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: ${subtle ? 0.25 : 0.5};
          }
          90% {
            opacity: ${subtle ? 0.25 : 0.5};
          }
          100% {
            transform: translateY(-20vh) rotate(45deg);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .medbg-ecg,
          .medbg-glow,
          .medbg-cross {
            animation: none;
          }
          .medbg-cross {
            opacity: ${subtle ? 0.15 : 0.35};
          }
        }
      `}</style>
    </div>
  )
}
