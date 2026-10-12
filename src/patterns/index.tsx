import { useCallback, type ReactNode } from "react";
import { PixelCanvas, type DrawFn } from "./PixelCanvas";
import {
  MOTION_SPEEDS,
  SOLID_COLORS,
  UNIFORMITY_LEVELS,
  drawBlackLevel,
  drawColors,
  drawGamma,
  drawGradients,
  drawGrayscale,
  drawMotion,
  drawSharpness,
  drawSolid,
  drawUniformity,
  drawWhiteLevel,
} from "./draw";
import { useI18n, type L } from "../i18n";

export interface PatternDef {
  id: string;
  name: L;
  summary: L;
  /** What the user should look for. */
  instructions: L[];
  /** Optional named variants the user can cycle through. */
  variants?: L[];
  /** CSS background used for the preview thumbnail. */
  thumb: string;
  render: (variant: number) => ReactNode;
}

function Static({ draw }: { draw: DrawFn }) {
  return <PixelCanvas draw={draw} />;
}

function Gamma({ channel }: { channel: number }) {
  const draw = useCallback<DrawFn>((c, w, h, d) => drawGamma(c, w, h, d, channel), [channel]);
  return <PixelCanvas draw={draw} />;
}

function Solid({ color }: { color: string }) {
  const draw = useCallback<DrawFn>((c, w, h) => drawSolid(c, w, h, color), [color]);
  return <PixelCanvas draw={draw} />;
}

function Uniformity({ value }: { value: number }) {
  const draw = useCallback<DrawFn>((c, w, h) => drawUniformity(c, w, h, value), [value]);
  return <PixelCanvas draw={draw} />;
}

function Motion({ speedSet }: { speedSet: number }) {
  const draw = useCallback<DrawFn>((c, w, h, d) => drawMotion(c, w, h, d, performance.now(), speedSet), [speedSet]);
  return <PixelCanvas draw={draw} animate />;
}

const PANGRAM: L = {
  en: "The quick brown fox jumps over the lazy dog. Sphinx of black quartz, judge my vow.",
  tr: "Pijamalı hasta yağız şoföre çabucak güvendi. Fahiş bluz güvencesi yağdırma projesi çöktü.",
};

function TextClarity({ dark }: { dark: boolean }) {
  const { t } = useI18n();
  const sizes = [11, 12, 13, 14, 16, 18, 22];
  return (
    <div className={`text-pattern ${dark ? "dark" : ""}`}>
      {sizes.map((s) => (
        <p key={s} style={{ fontSize: s }}>
          <b>{s}px</b> {t(PANGRAM)} 0123456789
        </p>
      ))}
      <div className="text-colors">
        <span style={{ color: "#d32f2f" }}>{t({ en: "Red text", tr: "Kırmızı yazı" })}</span>
        <span style={{ color: "#2e7d32" }}>{t({ en: "Green text", tr: "Yeşil yazı" })}</span>
        <span style={{ color: "#1565c0" }}>{t({ en: "Blue text", tr: "Mavi yazı" })}</span>
        <span style={{ color: "#888" }}>{t({ en: "Gray text", tr: "Gri yazı" })}</span>
      </div>
    </div>
  );
}

const COLOR_NAMES: L[] = [
  { en: "Black", tr: "Siyah" },
  { en: "White", tr: "Beyaz" },
  { en: "Red", tr: "Kırmızı" },
  { en: "Green", tr: "Yeşil" },
  { en: "Blue", tr: "Mavi" },
  { en: "Cyan", tr: "Camgöbeği" },
  { en: "Magenta", tr: "Macenta" },
  { en: "Yellow", tr: "Sarı" },
];

const UNIFORMITY_NAMES: L[] = [
  { en: "Black (backlight bleed)", tr: "Siyah (ışık sızması)" },
  { en: "Dark gray 10%", tr: "Koyu gri %10" },
  { en: "Gray 25%", tr: "Gri %25" },
  { en: "Gray 50%", tr: "Gri %50" },
  { en: "Gray 75%", tr: "Gri %75" },
  { en: "White 100%", tr: "Beyaz %100" },
];

const SPEED_NAMES: L[] = [
  { en: "Slow", tr: "Yavaş" },
  { en: "Medium", tr: "Orta" },
  { en: "Fast", tr: "Hızlı" },
];

export const PATTERNS: PatternDef[] = [
  {
    id: "black-level",
    name: { en: "Black Level", tr: "Siyah Seviyesi" },
    summary: { en: "Can you see detail in the shadows?", tr: "Gölgelerdeki ayrıntıları görebiliyor musunuz?" },
    instructions: [
      {
        en: "Squares 1–20 are slightly brighter than the black background.",
        tr: "1–20 numaralı kareler siyah arka plandan biraz daha açıktır.",
      },
      {
        en: "Ideally you can just make out square 2 or 3, and square 1 is barely visible.",
        tr: "İdeal durumda 2 veya 3 numaralı kare zar zor seçilir, 1 numaralı kare ise neredeyse hiç görünmez.",
      },
      {
        en: "If you only see squares from 5 or higher, shadows are being crushed.",
        tr: "Kareleri ancak 5'ten itibaren görebiliyorsanız koyu tonlar kayboluyor demektir.",
      },
      {
        en: "If the background itself looks gray rather than black, black level is too high.",
        tr: "Arka plan siyah yerine gri görünüyorsa siyah seviyesi fazla yüksektir.",
      },
    ],
    thumb: "radial-gradient(circle at 50% 50%, #151515 0 30%, #000 31%)",
    render: () => <Static draw={drawBlackLevel} />,
  },
  {
    id: "white-level",
    name: { en: "White Level", tr: "Beyaz Seviyesi" },
    summary: { en: "Are bright highlights clipped?", tr: "Parlak tonlar kırpılıyor mu?" },
    instructions: [
      {
        en: "Squares 235–254 are slightly darker than the white background.",
        tr: "235–254 numaralı kareler beyaz arka plandan biraz daha koyudur.",
      },
      {
        en: "Ideally you can see squares up to 252–254.",
        tr: "İdeal durumda 252–254'e kadar olan kareleri görebilirsiniz.",
      },
      {
        en: "If the brightest squares disappear into the background, Contrast is set too high.",
        tr: "En açık kareler arka planda kayboluyorsa kontrast fazla yüksektir.",
      },
    ],
    thumb: "radial-gradient(circle at 50% 50%, #ececec 0 30%, #fff 31%)",
    render: () => <Static draw={drawWhiteLevel} />,
  },
  {
    id: "gamma",
    name: { en: "Gamma", tr: "Gama" },
    summary: { en: "Midtone brightness, the overall 'punch'.", tr: "Ara tonların parlaklığı ve görüntünün genel canlılığı." },
    instructions: [
      {
        en: "Sit back or squint slightly so the fine lines blur together.",
        tr: "İnce çizgiler birbirine karışacak şekilde biraz geri çekilin ya da gözlerinizi hafifçe kısın.",
      },
      {
        en: "Find the bar where the center patch blends into the striped area. That number is your gamma.",
        tr: "Ortadaki düz renkli alanın çizgili bölgeyle kaynaştığı sütunu bulun. O sütunun altındaki sayı, ekranınızın gama değeridir.",
      },
      {
        en: "2.2 is the standard for PCs and the web; 2.4 suits movies in a dark room.",
        tr: "Bilgisayarlar ve web için standart değer 2.2'dir; karanlık odada film izlemek için 2.4 daha uygundur.",
      },
      {
        en: "Use the color variants to check whether red, green and blue track the same gamma.",
        tr: "Kırmızı, yeşil ve mavinin aynı gama değerinde olup olmadığını renk varyantlarıyla kontrol edin.",
      },
    ],
    variants: [
      { en: "Gray", tr: "Gri" },
      { en: "Red", tr: "Kırmızı" },
      { en: "Green", tr: "Yeşil" },
      { en: "Blue", tr: "Mavi" },
    ],
    thumb: "repeating-linear-gradient(0deg, #fff 0 1px, #000 1px 2px)",
    render: (v) => <Gamma channel={v} />,
  },
  {
    id: "grayscale",
    name: { en: "Gray Balance", tr: "Gri Dengesi" },
    summary: { en: "Grays should look neutral, without a color tint.", tr: "Griler, herhangi bir renk tonu olmadan nötr görünmeli." },
    instructions: [
      {
        en: "Every gray step should look neutral, with no pink, green, blue or yellow tint.",
        tr: "Her gri basamak pembe, yeşil, mavi veya sarı bir ton taşımadan nötr görünmeli.",
      },
      {
        en: "The smooth ramp at the bottom should not shift color from dark to light.",
        tr: "Alttaki geçiş şeridinin rengi koyudan açığa doğru değişmemeli.",
      },
      {
        en: "A tint usually means the color temperature or RGB gain is off.",
        tr: "Bir renk tonu görüyorsanız genellikle renk sıcaklığı veya RGB kazancı doğru ayarlanmamıştır.",
      },
    ],
    thumb: "linear-gradient(90deg, #000, #fff)",
    render: () => <Static draw={drawGrayscale} />,
  },
  {
    id: "gradients",
    name: { en: "Gradients", tr: "Renk Geçişleri" },
    summary: { en: "Smooth transitions, no banding.", tr: "Yumuşak geçişler, bantlanma yok." },
    instructions: [
      {
        en: "Each ramp should look perfectly smooth from left to right.",
        tr: "Her şerit soldan sağa kusursuz bir yumuşaklıkla geçmeli.",
      },
      {
        en: "Visible steps, stripes or color blotches are called banding.",
        tr: "Görünür basamaklara, çizgilere veya renk lekelerine bantlanma denir.",
      },
      {
        en: "Banding is often caused by dynamic contrast, picture enhancers or reduced color depth in GPU settings.",
        tr: "Bantlanmanın sık görülen nedenleri dinamik kontrast, görüntü iyileştirme özellikleri ve ekran kartı ayarlarında düşürülmüş renk derinliğidir.",
      },
    ],
    thumb: "linear-gradient(180deg, transparent 0 75%, #00f 75%), linear-gradient(90deg, #000, #f00)",
    render: () => <Static draw={drawGradients} />,
  },
  {
    id: "sharpness",
    name: { en: "Sharpness", tr: "Keskinlik" },
    summary: { en: "Crisp lines without halos.", tr: "Hale olmadan net çizgiler." },
    instructions: [
      {
        en: "Fine lines and the checkerboard should look clean and even.",
        tr: "İnce çizgiler ve dama deseni temiz ve düzgün görünmeli.",
      },
      {
        en: "Bright or dark outlines (halos) around the black and white blocks mean Sharpness is too high.",
        tr: "Siyah ve beyaz blokların çevresinde açık veya koyu çizgiler (hale) varsa keskinlik fazla yüksektir.",
      },
      {
        en: "Blurry text usually means you're not at native resolution or scaling is off.",
        tr: "Yazılar bulanıksa genellikle ekran doğal çözünürlüğünde çalışmıyordur ya da ölçekleme ayarı yanlıştır.",
      },
    ],
    thumb: "repeating-linear-gradient(90deg, #fff 0 1px, #000 1px 2px)",
    render: () => <Static draw={drawSharpness} />,
  },
  {
    id: "colors",
    name: { en: "Color Bars", tr: "Renk Çubukları" },
    summary: { en: "Saturation steps and color clipping.", tr: "Doygunluk basamakları ve renk kırpılması." },
    instructions: [
      { en: "Colors should look rich but natural, not neon.", tr: "Renkler canlı ama doğal görünmeli, neon gibi değil." },
      {
        en: "Every saturation step from 10% to 100% should be distinguishable.",
        tr: "%10'dan %100'e kadar her doygunluk basamağı birbirinden ayırt edilebilmeli.",
      },
      {
        en: "If the last few steps look identical, the monitor is clipping saturated colors (try its sRGB mode).",
        tr: "Son birkaç basamak aynı görünüyorsa monitör doygun renkleri kırpıyordur (sRGB modunu deneyin).",
      },
    ],
    thumb: "linear-gradient(90deg, #fff 0 12.5%, #ff0 0 25%, #0ff 0 37.5%, #0f0 0 50%, #f0f 0 62.5%, #f00 0 75%, #00f 0 87.5%, #000 0)",
    render: () => <Static draw={drawColors} />,
  },
  {
    id: "uniformity",
    name: { en: "Uniformity", tr: "Ekran Homojenliği" },
    summary: { en: "Even brightness, backlight bleed.", tr: "Eşit parlaklık ve arka ışık sızması." },
    instructions: [
      {
        en: "The whole screen should look evenly lit, corners included.",
        tr: "Köşeler dahil ekranın tamamı eşit şekilde aydınlık görünmeli.",
      },
      {
        en: "On the black screen, glowing patches near the edges are backlight bleed (best checked in a dark room).",
        tr: "Siyah ekranda kenarlara yakın parlayan bölgeler arka ışık sızmasıdır (en iyi karanlık odada kontrol edilir).",
      },
      {
        en: "Some variation is normal, especially on IPS and VA panels.",
        tr: "Özellikle IPS ve VA panellerde bir miktar farklılık normaldir.",
      },
    ],
    variants: UNIFORMITY_NAMES,
    thumb: "radial-gradient(circle at 50% 50%, #8a8a8a, #6a6a6a)",
    render: (v) => <Uniformity value={UNIFORMITY_LEVELS[v]} />,
  },
  {
    id: "dead-pixels",
    name: { en: "Dead Pixels", tr: "Ölü Pikseller" },
    summary: { en: "Find dead or stuck pixels.", tr: "Ölü veya takılı pikselleri bulun." },
    instructions: [
      {
        en: "Scan each solid color for tiny dots that don't match.",
        tr: "Her düz renkte, o renge uymayan küçük noktalar olup olmadığına bakın.",
      },
      {
        en: "A dot that stays black is a dead pixel; a dot stuck on one color is a stuck pixel.",
        tr: "Hep siyah kalan nokta ölü piksel, tek bir renkte takılı kalan nokta ise takılı pikseldir.",
      },
      {
        en: "Dust on the screen can look similar. Wipe the screen gently and check again.",
        tr: "Ekrandaki toz da benzer görünebilir. Ekranı nazikçe silip tekrar kontrol edin.",
      },
    ],
    variants: COLOR_NAMES,
    thumb: "linear-gradient(135deg, #f00 0 33%, #0f0 0 66%, #00f 0)",
    render: (v) => <Solid color={SOLID_COLORS[v]} />,
  },
  {
    id: "motion",
    name: { en: "Motion Clarity", tr: "Hareket Netliği" },
    summary: { en: "Ghosting, trails and overdrive.", tr: "Gölgelenme, izler ve overdrive." },
    instructions: [
      { en: "Follow the moving object with your eyes.", tr: "Hareket eden nesneyi gözlerinizle takip edin." },
      {
        en: "A dark smear behind it is ghosting; a bright or colored halo is overshoot from too much Overdrive.",
        tr: "Arkasındaki koyu iz gölgelenmedir (ghosting). Parlak veya renkli bir hale ise overdrive'ın fazla yüksek olmasından kaynaklanan aşmadır (overshoot).",
      },
      {
        en: "Set Overdrive / Response Time to the level with the cleanest edges in all three lanes.",
        tr: "Overdrive / Tepki Süresi ayarını, üç şeritte de kenarların en temiz göründüğü seviyeye getirin.",
      },
      {
        en: "Higher refresh rates make motion look clearer.",
        tr: "Yenileme hızı yükseldikçe hareket daha net görünür.",
      },
    ],
    variants: SPEED_NAMES.map((n, i) => {
      const speeds = MOTION_SPEEDS.map((s) => Math.round(s * [0.5, 1, 1.5][i])).join(" / ");
      return { en: `${n.en} (${speeds} px/s)`, tr: `${n.tr} (${speeds} px/sn)` };
    }),
    thumb: "linear-gradient(180deg, #202020 0 33%, #808080 0 66%, #e0e0e0 0)",
    render: (v) => <Motion speedSet={v} />,
  },
  {
    id: "text",
    name: { en: "Text Clarity", tr: "Yazı Netliği" },
    summary: { en: "Readable, comfortable text.", tr: "Okunaklı ve rahat yazı." },
    instructions: [
      {
        en: "Text should look crisp without color fringes or fuzzy edges.",
        tr: "Yazılar, kenarlarında renk saçağı veya bulanıklık olmadan net görünmeli.",
      },
      {
        en: "If text looks blurry, check that the display runs at its native resolution.",
        tr: "Yazılar bulanıksa ekranın doğal çözünürlüğünde çalıştığını kontrol edin.",
      },
      {
        en: "On Windows, run the ClearType Text Tuner if small text looks colored at the edges.",
        tr: "Windows'ta küçük yazıların kenarları renkli görünüyorsa ClearType Metin Ayarlayıcısı'nı çalıştırın.",
      },
    ],
    variants: [
      { en: "Dark on light", tr: "Açık zeminde koyu yazı" },
      { en: "Light on dark", tr: "Koyu zeminde açık yazı" },
    ],
    thumb: "repeating-linear-gradient(180deg, #fff 0 6px, #999 6px 7px)",
    render: (v) => <TextClarity dark={v === 1} />,
  },
];

export const getPattern = (id: string): PatternDef => PATTERNS.find((p) => p.id === id) ?? PATTERNS[0];
