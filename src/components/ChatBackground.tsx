'use client'

/**
 * Plano de fundo temático para a tela de Mensagens Internas.
 * Mascote "Dr. Scan" (robô de tomografia simpático) + doodles médicos flutuando.
 * Tudo em SVG puro, leve e com pointer-events-none.
 */
export default function ChatBackground() {
  return (
    <div className="chatbg" aria-hidden="true">
      <div className="chatbg-base" />

      {/* Doodles médicos espalhados */}
      <div className="chatbg-doodle chatbg-d1">🩻</div>
      <div className="chatbg-doodle chatbg-d2">💙</div>
      <div className="chatbg-doodle chatbg-d3">🔬</div>
      <div className="chatbg-doodle chatbg-d4">📋</div>
      <div className="chatbg-doodle chatbg-d5">🩺</div>
      <div className="chatbg-doodle chatbg-d6">✨</div>
      <div className="chatbg-doodle chatbg-d7">🩻</div>
      <div className="chatbg-doodle chatbg-d8">💙</div>

      {/* Mascote central: robô de tomografia simpático */}
      <svg className="chatbg-mascot" viewBox="0 0 220 260" xmlns="http://www.w3.org/2000/svg">
        {/* Arco do tomógrafo */}
        <path d="M30 110 a80 80 0 0 1 160 0" fill="none" stroke="#93c5fd" strokeWidth="14" strokeLinecap="round" opacity="0.55" />
        <circle cx="30" cy="110" r="9" fill="#60a5fa" opacity="0.6" />
        <circle cx="190" cy="110" r="9" fill="#60a5fa" opacity="0.6" />

        {/* Mesa de exame */}
        <rect x="50" y="205" width="120" height="14" rx="7" fill="#bfdbfe" opacity="0.6" />

        {/* Corpo do robozinho (cabeça arredondada) */}
        <rect x="65" y="120" width="90" height="78" rx="28" fill="#dbeafe" stroke="#93c5fd" strokeWidth="3" opacity="0.85" />
        {/* Antena */}
        <line x1="110" y1="120" x2="110" y2="100" stroke="#93c5fd" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        <circle cx="110" cy="95" r="7" fill="#60a5fa" opacity="0.7" />

        {/* Tela/rosto */}
        <rect x="80" y="138" width="60" height="40" rx="12" fill="#1e40af" opacity="0.75" />
        {/* Olhos felizes */}
        <circle cx="98" cy="158" r="5" fill="#bfdbfe" />
        <circle cx="122" cy="158" r="5" fill="#bfdbfe" />
        {/* Sorriso */}
        <path d="M96 168 q14 10 28 0" fill="none" stroke="#bfdbfe" strokeWidth="3" strokeLinecap="round" />

        {/* Bracinhos */}
        <line x1="65" y1="155" x2="42" y2="170" stroke="#93c5fd" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
        <line x1="155" y1="155" x2="178" y2="170" stroke="#93c5fd" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
        {/* Mãozinhas - uma segurando uma pranchetinha */}
        <circle cx="42" cy="170" r="7" fill="#60a5fa" opacity="0.7" />
        <rect x="170" y="160" width="18" height="22" rx="3" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2" opacity="0.85" />
        <line x1="174" y1="166" x2="184" y2="166" stroke="#93c5fd" strokeWidth="1.5" />
        <line x1="174" y1="171" x2="184" y2="171" stroke="#93c5fd" strokeWidth="1.5" />

        {/* Perninhas curtas */}
        <line x1="90" y1="198" x2="90" y2="205" stroke="#93c5fd" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
        <line x1="130" y1="198" x2="130" y2="205" stroke="#93c5fd" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
      </svg>

      <style jsx>{`
        .chatbg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }
        .chatbg-base {
          position: absolute;
          inset: 0;
          background: linear-gradient(160deg, #f8fafc 0%, #eff6ff 45%, #f0f9ff 100%);
        }
        .chatbg-mascot {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 200px;
          height: auto;
          transform: translate(-50%, -50%);
          opacity: 0.5;
          animation: chatbg-float-mascot 6s ease-in-out infinite;
        }
        @keyframes chatbg-float-mascot {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-8px); }
        }
        .chatbg-doodle {
          position: absolute;
          font-size: 22px;
          opacity: 0.18;
          filter: grayscale(0.2);
          animation: chatbg-drift 14s ease-in-out infinite;
        }
        .chatbg-d1 { top: 8%; left: 10%; font-size: 26px; animation-delay: 0s; }
        .chatbg-d2 { top: 18%; right: 14%; font-size: 18px; animation-delay: 2s; }
        .chatbg-d3 { top: 70%; left: 8%; font-size: 22px; animation-delay: 4s; }
        .chatbg-d4 { top: 80%; right: 10%; font-size: 20px; animation-delay: 1s; }
        .chatbg-d5 { top: 40%; left: 5%; font-size: 24px; animation-delay: 6s; }
        .chatbg-d6 { top: 12%; left: 45%; font-size: 16px; animation-delay: 3s; }
        .chatbg-d7 { top: 88%; left: 42%; font-size: 20px; animation-delay: 5s; }
        .chatbg-d8 { top: 55%; right: 6%; font-size: 18px; animation-delay: 7s; }
        @keyframes chatbg-drift {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(6deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .chatbg-mascot, .chatbg-doodle { animation: none; }
        }
      `}</style>
    </div>
  )
}
