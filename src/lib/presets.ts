import type { L } from "../i18n";

export type UseCase = "general" | "photo" | "movie" | "gaming" | "office";
export type Ambient = "bright" | "dim" | "dark";

export const USE_CASES: { id: UseCase; label: L; hint: L }[] = [
  {
    id: "general",
    label: { en: "General", tr: "Genel" },
    hint: { en: "Web, video, a bit of everything", tr: "Web, video ve günlük kullanım" },
  },
  {
    id: "photo",
    label: { en: "Photo & Design", tr: "Fotoğraf ve Tasarım" },
    hint: { en: "Accurate color and tone", tr: "Doğru renk ve ton" },
  },
  {
    id: "movie",
    label: { en: "Movies & Series", tr: "Film ve Dizi" },
    hint: { en: "Cinematic contrast", tr: "Sinematik kontrast" },
  },
  {
    id: "gaming",
    label: { en: "Gaming", tr: "Oyun" },
    hint: { en: "Shadow detail and clear motion", tr: "Gölge ayrıntısı ve net hareket" },
  },
  {
    id: "office",
    label: { en: "Office & Reading", tr: "Ofis ve Okuma" },
    hint: { en: "Comfortable for long hours", tr: "Uzun saatler için rahat" },
  },
];

export const AMBIENTS: { id: Ambient; label: L; hint: L }[] = [
  {
    id: "bright",
    label: { en: "Bright room", tr: "Aydınlık oda" },
    hint: { en: "Daylight or strong lights", tr: "Gün ışığı veya güçlü aydınlatma" },
  },
  {
    id: "dim",
    label: { en: "Dim room", tr: "Loş oda" },
    hint: { en: "Soft indoor lighting", tr: "Yumuşak iç mekân aydınlatması" },
  },
  {
    id: "dark",
    label: { en: "Dark room", tr: "Karanlık oda" },
    hint: { en: "Lights off or nearly off", tr: "Işıklar kapalı ya da çok az" },
  },
];

export interface Targets {
  /** Recommended white luminance range in cd/m² (nits). */
  luminance: [number, number];
  gamma: number;
  whitePoint: string;
  tips: L[];
}

const BASE_LUMINANCE: Record<Ambient, [number, number]> = {
  bright: [160, 220],
  dim: [110, 150],
  dark: [70, 100],
};

export function getTargets(useCase: UseCase, ambient: Ambient): Targets {
  let [lo, hi] = BASE_LUMINANCE[ambient];
  let gamma = 2.2;
  const tips: L[] = [];

  switch (useCase) {
    case "photo":
      // Editing and print matching work best with a moderate white level.
      lo = Math.min(lo, 100);
      hi = Math.min(hi, 140);
      tips.push({
        en: "Use the monitor's sRGB mode if it has one; it limits oversaturated colors.",
        tr: "Monitörünüzde sRGB modu varsa kullanın; aşırı doygun renkleri sınırlar.",
      });
      tips.push({
        en: "Keep room lighting consistent while you edit.",
        tr: "Düzenleme yaparken oda aydınlatmasını sabit tutun.",
      });
      break;
    case "movie":
      if (ambient === "dark") gamma = 2.4;
      tips.push({
        en: "Turn off dynamic contrast and noise reduction; they crush shadow detail.",
        tr: "Dinamik kontrastı ve gürültü azaltmayı kapatın; gölgelerdeki ayrıntıları yok ederler.",
      });
      break;
    case "gaming":
      tips.push({
        en: "Set Overdrive / Response Time to a medium level; the highest level often causes bright trails.",
        tr: "Overdrive / Tepki Süresi ayarını orta seviyeye getirin; en yüksek seviye çoğu zaman parlak izlere yol açar.",
      });
      tips.push({
        en: "Enable the monitor's low input lag or game mode if available.",
        tr: "Varsa monitörün düşük gecikme (low input lag) veya oyun modunu açın.",
      });
      tips.push({
        en: "Avoid 'Black Equalizer' / shadow boost for accurate images; use it only for competitive play.",
        tr: "Doğru bir görüntü için 'Black Equalizer' / gölge güçlendirme özelliğini kullanmayın; yalnızca rekabetçi oyunlarda açın.",
      });
      break;
    case "office":
      hi = hi + 20;
      tips.push({
        en: "If your eyes tire in the evening, lower brightness first, then use a warmer night mode.",
        tr: "Akşamları gözleriniz yoruluyorsa önce parlaklığı düşürün, ardından daha sıcak bir gece modu kullanın.",
      });
      break;
    case "general":
      break;
  }

  return { luminance: [lo, hi], gamma, whitePoint: "6500K (D65)", tips };
}
