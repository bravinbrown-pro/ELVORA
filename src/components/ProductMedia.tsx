import { useState } from 'react';
import { Cpu } from 'lucide-react';
import { ProductImageKey } from '../utils/commerce';
import heroFlagshipUrl from '../assets/images/hero_elvora_flagship_1792961335997.jpg';
import ancHeadphonesUrl from '../assets/images/product_anc_headphones_1792961337284.jpg';
import smartwatchUltraUrl from '../assets/images/product_smartwatch_ultra_1792961338821.jpg';
import ganPowerbankUrl from '../assets/images/product_gan_powerbank_1792961339019.jpg';
import twsEarbudsUrl from '../assets/images/product_tws_earbuds_1792961339201.jpg';
import comboEarpodsWatchUrl from '../assets/images/combo_earpods_watch_1792966180136.jpg';
import computingOledSuiteUrl from '../assets/images/computing_oled_suite_1792966181905.jpg';
import audioSoundbarSpeakerUrl from '../assets/images/audio_soundbar_speaker_1792966182901.jpg';
import powerSolarStationUrl from '../assets/images/power_solar_station_1792966184142.jpg';

const IMAGE_MAP: Record<ProductImageKey, string> = {
  hero_flagship: heroFlagshipUrl,
  anc_headphones: ancHeadphonesUrl,
  smartwatch_ultra: smartwatchUltraUrl,
  gan_powerbank: ganPowerbankUrl,
  tws_earbuds: twsEarbudsUrl,
  combo_earpods_watch: comboEarpodsWatchUrl,
  computing_oled_suite: computingOledSuiteUrl,
  audio_soundbar_speaker: audioSoundbarSpeakerUrl,
  power_solar_station: powerSolarStationUrl,
};

interface ProductMediaProps {
  imageKey: ProductImageKey;
  alt: string;
  aspectClass?: string;
  className?: string;
}

export function ProductMedia({
  imageKey,
  alt,
  aspectClass = 'aspect-[4/3]',
  className = '',
}: ProductMediaProps) {
  const [failed, setFailed] = useState(false);
  const src = IMAGE_MAP[imageKey];

  return (
    <div
      className={`relative overflow-hidden bg-zinc-900 ${aspectClass} ${className}`}
    >
      {!failed && src ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 text-center">
          <Cpu className="h-8 w-8 text-zinc-400" aria-hidden="true" />
          <span className="font-display text-xs font-semibold tracking-wide text-zinc-200">
            {alt}
          </span>
        </div>
      )}
    </div>
  );
}
