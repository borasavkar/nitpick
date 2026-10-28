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
        en: "Set Overdrive / Response Time to a medium level. Too low leaves dark trails behind moving objects (common on VA panels); the highest level adds bright halos. Check it with the Motion Clarity pattern.",
        tr: "Overdrive / Tepki Süresi ayarını orta seviyeye getirin. Düşük seviye, hareket eden nesnelerin arkasında koyu izler bırakır (VA panellerde sık görülür); en yüksek seviye ise parlak haleler ekler. Hareket Netliği deseniyle kontrol edin.",
      });
      tips.push({
        en: "Turn on FreeSync / G-Sync (adaptive sync) in both the monitor menu and your graphics driver, and connect over DisplayPort to get the highest refresh rate.",
        tr: "FreeSync / G-Sync'i (uyarlanabilir senkronizasyon) hem monitör menüsünde hem ekran kartı ayarlarında açın. En yüksek yenileme hızı için monitörü DisplayPort ile bağlayın.",
      });
      tips.push({
        en: "Keep motion blur reduction (MBR, ELMB, strobing) off unless you need it: it dims the screen noticeably and usually can't run together with FreeSync / G-Sync.",
        tr: "Hareket bulanıklığı azaltma özelliğini (MBR, ELMB, strobing) gerekmedikçe kapalı tutun: ekranı belirgin şekilde karartır ve çoğu monitörde FreeSync / G-Sync ile birlikte çalışmaz.",
      });
      tips.push({
        en: "Turn off dynamic contrast (DCR) and color boosters (DCB, Picture Boost, Vivid): they make brightness jump between scenes and push colors away from accurate.",
        tr: "Dinamik kontrastı (DCR) ve renk güçlendiricileri (DCB, Picture Boost, Canlı mod) kapatın: sahneden sahneye parlaklık sıçramalarına yol açar ve renkleri doğruluktan uzaklaştırır.",
      });
      tips.push({
        en: "Enable the monitor's low input lag setting if it has one.",
        tr: "Monitörünüzde düşük gecikme (low input lag) ayarı varsa açın.",
      });
      tips.push({
        en: "Avoid 'Black Equalizer' / 'Shadow Control' boosts for accurate images; they turn blacks gray. Use them only for competitive play.",
        tr: "Doğru bir görüntü için 'Black Equalizer' / 'Shadow Control' gibi gölge güçlendirmeleri kullanmayın; siyahları griye çevirir. Yalnızca rekabetçi oyunlarda açın.",
      });
      tips.push({
        en: "On monitors with entry-level HDR (such as DisplayHDR 400), keep Windows HDR off on the desktop and turn it on only for games that handle HDR well (Win + Alt + B toggles it on Windows 11).",
        tr: "Giriş seviyesi HDR'ye sahip monitörlerde (ör. DisplayHDR 400) masaüstünde Windows HDR'yi kapalı tutun; yalnızca HDR'yi iyi destekleyen oyunlarda açın (Windows 11'de Win + Alt + B ile açılıp kapanır).",
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
