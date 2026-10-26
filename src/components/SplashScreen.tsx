import { ElvoraImageLogo } from './ElvoraLogo';

/**
 * Enhanced Premium Splash Screen for ELVORA.
 * Features a cinematic background and high-fidelity image logo.
 */
export function SplashScreen({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-[100] cursor-pointer flex flex-col items-center justify-center bg-[#050402] transition-opacity duration-1000 overflow-hidden"
    >
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0 scale-110 animate-[subtle-zoom_20s_infinite_alternate]">
        <img 
          src="/src/assets/images/elvora_splash_background_1793003111032.jpg" 
          alt="" 
          className="h-full w-full object-cover opacity-60 mix-blend-overlay"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050402] via-transparent to-[#050402]/80" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative">
          {/* Outer glow aura */}
          <div className="absolute inset-[-50px] animate-pulse rounded-full bg-gradient-to-r from-[#F7E298]/20 via-[#DCA836]/20 to-transparent blur-3xl" />
          <ElvoraImageLogo size="xl" className="relative animate-in fade-in zoom-in duration-1000 border-2 border-[#DCA836]/60 shadow-[0_0_60px_rgba(220,168,54,0.35)]" />
        </div>
        
        <div className="mt-10 flex flex-col items-center space-y-5">
          <div className="flex flex-col items-center">
            <h1 className="font-display text-3xl font-bold tracking-[0.35em] bg-gradient-to-r from-[#FFFBF0] via-[#F7E298] to-[#DCA836] bg-clip-text text-transparent uppercase animate-in slide-in-from-bottom-8 duration-1000 drop-shadow-md">
              Elvora
            </h1>
            <span className="text-[10px] font-semibold tracking-[0.3em] text-[#A89874] uppercase mt-1">
              HAUTE TECH & INNOVATION
            </span>
            <div className="mt-3 h-px w-32 bg-gradient-to-r from-transparent via-[#DCA836]/60 to-transparent" />
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="h-0.5 w-20 overflow-hidden rounded-full bg-[#1c1812]">
              <div className="h-full w-full animate-[progress_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-[#F7E298] to-transparent" />
            </div>
            <p className="text-[11px] font-medium tracking-[0.25em] text-[#A89874] uppercase animate-pulse">
              Authenticating Ultra Premium Access
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes subtle-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
