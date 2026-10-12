import type { L } from "../i18n";
import type { Targets } from "./presets";

export type Tone = "good" | "warn" | "bad";

export interface Advice {
  tone: Tone;
  text: L;
}

export interface WizardOption {
  id: string;
  label: L;
}

export interface WizardStep {
  id: string;
  title: L;
  /** Pattern shown behind the panel; null shows a neutral backdrop. */
  patternId: string | null;
  variant?: number;
  instructions: (t: Targets) => L[];
  /** Which monitor menu settings this step is about. */
  controls?: L;
  question?: L;
  options?: WizardOption[];
  advise?: (answer: string, t: Targets) => Advice;
  optional?: boolean;
}

const RANGE_TIP: L = {
  en: "Make sure your PC and monitor use the same RGB range: set the GPU output to Full RGB (NVIDIA: 'Output dynamic range: Full'; AMD: 'Pixel format: RGB 4:4:4 Full') and the monitor's 'HDMI Black Level' / 'RGB Range' to Full or High (or Auto).",
  tr: "Bilgisayarınızın ve monitörünüzün aynı RGB aralığını kullandığından emin olun: Ekran kartı çıkışını Tam RGB olarak ayarlayın (NVIDIA: 'Çıkış dinamik aralığı: Tam'; AMD: 'Piksel biçimi: RGB 4:4:4 Tam') ve monitördeki 'HDMI Black Level' / 'RGB Range' ayarını Full, High veya Auto yapın.",
};

const g = (t: Targets) => t.gamma.toFixed(1);

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: "prep",
    title: { en: "Get ready", tr: "Hazırlık" },
    patternId: null,
    instructions: () => [
      {
        en: "Let the monitor warm up for 15–30 minutes. Colors and brightness drift while it's cold.",
        tr: "Monitörü 15–30 dakika ısınmaya bırakın. Soğukken renkler ve parlaklık biraz kayar.",
      },
      {
        en: "Set the lighting in your room the way it usually is when you use the screen.",
        tr: "Oda aydınlatmasını, ekranı normalde kullandığınız gibi ayarlayın.",
      },
      {
        en: "In the monitor's menu, turn off Dynamic Contrast, ECO / Energy Saving, Auto Brightness and light sensors.",
        tr: "Monitör menüsünden Dinamik Kontrast (Dynamic Contrast), ECO / Enerji Tasarrufu, Otomatik Parlaklık ve ışık sensörü özelliklerini kapatın.",
      },
      {
        en: "Pick a neutral picture mode such as Standard, Custom, User or sRGB. Avoid Vivid, Dynamic or Game modes for now.",
        tr: "Standart, Özel, Kullanıcı (User) veya sRGB gibi nötr bir görüntü modu seçin. Şimdilik Canlı (Vivid), Dinamik ve Oyun modlarından kaçının.",
      },
      {
        en: "Run the display at its native resolution, and turn HDR off in your OS for this setup.",
        tr: "Ekranı doğal (native) çözünürlüğünde kullanın ve ayar boyunca işletim sisteminizde HDR'yi kapalı tutun.",
      },
    ],
  },
  {
    id: "brightness",
    title: { en: "Brightness", tr: "Parlaklık" },
    patternId: "dead-pixels",
    variant: 1,
    controls: { en: "Brightness / Backlight", tr: "Parlaklık (Brightness) / Arka ışık (Backlight)" },
    instructions: (t) => [
      {
        en: "Hold a sheet of white paper next to the screen, lit by your normal room light.",
        tr: "Ekranın yanına, odanın normal ışığı altında beyaz bir kâğıt tutun.",
      },
      {
        en: "Adjust the monitor's Brightness until the white screen looks about as bright as the paper, not glowing brighter.",
        tr: "Beyaz ekran kâğıtla aşağı yukarı aynı parlaklıkta görünene kadar monitörün parlaklık ayarını değiştirin. Ekran, kâğıttan belirgin şekilde parlak olmamalı.",
      },
      {
        en: `For your setup, the target is roughly ${t.luminance[0]}–${t.luminance[1]} cd/m² (nits). Most monitors reach this between 20% and 50% Brightness.`,
        tr: `Seçtiğiniz kullanım için hedef parlaklık yaklaşık ${t.luminance[0]}–${t.luminance[1]} cd/m² (nit). Çoğu monitör bu değere, parlaklık ayarı %20 ile %50 arasındayken ulaşır.`,
      },
    ],
    question: { en: "How does the screen compare to the paper now?", tr: "Ekran şimdi kâğıda göre nasıl görünüyor?" },
    options: [
      { id: "match", label: { en: "About the same", tr: "Aşağı yukarı aynı" } },
      { id: "brighter", label: { en: "Screen is brighter", tr: "Ekran daha parlak" } },
      { id: "dimmer", label: { en: "Screen is dimmer", tr: "Ekran daha soluk" } },
    ],
    advise: (a) =>
      a === "match"
        ? {
            tone: "good",
            text: {
              en: "Comfortable brightness for your room. Good for your eyes over long sessions.",
              tr: "Odanız için rahat bir parlaklık. Uzun kullanımda gözlerinizi yormaz.",
            },
          }
        : a === "brighter"
          ? {
              tone: "warn",
              text: {
                en: "Lower Brightness until it matches the paper. A screen that's too bright causes eye strain and makes blacks look gray.",
                tr: "Kâğıtla eşleşene kadar parlaklığı düşürün. Fazla parlak bir ekran gözleri yorar ve siyahların gri görünmesine yol açar.",
              },
            }
          : {
              tone: "warn",
              text: {
                en: "Raise Brightness a little. If it's already at maximum, your room may be very bright; that's OK, just keep it high.",
                tr: "Parlaklığı biraz artırın. Zaten en yüksek seviyedeyse odanız çok aydınlık olabilir. Bu bir sorun değil; parlaklığı yüksek tutun.",
              },
            },
  },
  {
    id: "black",
    title: { en: "Black level", tr: "Siyah seviyesi" },
    patternId: "black-level",
    controls: {
      en: "Brightness, Black Level / Black Equalizer, RGB Range",
      tr: "Parlaklık, Siyah Seviyesi (Black Level / Black Equalizer), RGB Aralığı (RGB Range)",
    },
    instructions: () => [
      {
        en: "Squares 1–20 are slightly lighter than the black background.",
        tr: "1'den 20'ye kadar numaralı kareler, siyah arka plandan biraz daha açık tondadır.",
      },
      {
        en: "Count the squares you can see. The darkest ones should be just barely visible.",
        tr: "Görebildiğiniz kareleri sayın. En koyu kareler zar zor seçilebilmeli.",
      },
    ],
    question: { en: "What's the lowest-numbered square you can see?", tr: "Görebildiğiniz en küçük numaralı kare hangisi?" },
    options: [
      { id: "1-2", label: { en: "1 or 2", tr: "1 veya 2" } },
      { id: "3-4", label: { en: "3 or 4", tr: "3 veya 4" } },
      { id: "5-8", label: { en: "5 to 8", tr: "5 ile 8 arası" } },
      { id: "9+", label: { en: "9 or higher", tr: "9 veya üzeri" } },
      { id: "gray", label: { en: "Background looks gray", tr: "Arka plan gri görünüyor" } },
    ],
    advise: (a) => {
      switch (a) {
        case "1-2":
          return { tone: "good", text: { en: "Excellent shadow detail.", tr: "Gölgelerdeki ayrıntılar mükemmel görünüyor." } };
        case "3-4":
          return {
            tone: "good",
            text: {
              en: "Good shadow detail. This is normal for most monitors.",
              tr: "Gölge ayrıntıları iyi. Çoğu monitör için bu normaldir.",
            },
          };
        case "5-8":
          return {
            tone: "warn",
            text: {
              en: `Shadows are slightly crushed. ${RANGE_TIP.en} Also try a lower Gamma mode, or turn Black Equalizer / Shadow Boost up one step.`,
              tr: `Koyu tonlar biraz kayboluyor. ${RANGE_TIP.tr} Ayrıca daha düşük bir gama modu deneyin ya da Black Equalizer / Shadow Boost ayarını bir kademe artırın.`,
            },
          };
        case "9+":
          return {
            tone: "bad",
            text: {
              en: `Shadows are clearly crushed. ${RANGE_TIP.en} Make sure Dynamic Contrast is off, then try a lower Gamma mode.`,
              tr: `Koyu tonlar belirgin şekilde kayboluyor. ${RANGE_TIP.tr} Dinamik kontrastın kapalı olduğundan emin olun, ardından daha düşük bir gama modu deneyin.`,
            },
          };
        default:
          return {
            tone: "bad",
            text: {
              en: `Black is too bright. Often the monitor expects Limited range while the PC sends Full (or the other way around). ${RANGE_TIP.en} Then lower Black Level / Black Equalizer if your monitor has it.`,
              tr: `Siyahlar fazla açık. Bunun sık görülen nedeni, bilgisayar Tam (Full) aralık gönderirken monitörün Sınırlı (Limited) aralık beklemesi ya da bunun tersidir. ${RANGE_TIP.tr} Ardından monitörünüzde varsa Black Level / Black Equalizer ayarını düşürün.`,
            },
          };
      }
    },
  },
  {
    id: "white",
    title: { en: "White level", tr: "Beyaz seviyesi" },
    patternId: "white-level",
    controls: { en: "Contrast", tr: "Kontrast (Contrast)" },
    instructions: () => [
      {
        en: "Squares 235–254 are slightly darker than the white background.",
        tr: "235'ten 254'e kadar numaralı kareler, beyaz arka plandan biraz daha koyu tondadır.",
      },
      {
        en: "Lower the monitor's Contrast if the brightest squares disappear into the background.",
        tr: "En açık kareler arka planda kayboluyorsa monitörün kontrast ayarını düşürün.",
      },
    ],
    question: { en: "Up to which square can you still see?", tr: "Hangi kareye kadar görebiliyorsunuz?" },
    options: [
      { id: "253", label: { en: "253 or 254", tr: "253 veya 254" } },
      { id: "250", label: { en: "250 to 252", tr: "250 ile 252 arası" } },
      { id: "245", label: { en: "Around 245", tr: "245 civarı" } },
      { id: "none", label: { en: "Hardly any", tr: "Neredeyse hiçbiri görünmüyor" } },
    ],
    advise: (a) =>
      a === "253" || a === "250"
        ? {
            tone: "good",
            text: {
              en: "Highlights are preserved. Keep this Contrast setting.",
              tr: "Parlak tonlardaki ayrıntılar korunuyor. Bu kontrast ayarını değiştirmeyin.",
            },
          }
        : a === "245"
          ? {
              tone: "warn",
              text: {
                en: "Highlights are clipping. Lower Contrast a few steps until 250+ becomes visible.",
                tr: "Parlak tonlar kırpılıyor. 250 ve üzeri kareler görünür hâle gelene kadar kontrastı birkaç kademe düşürün.",
              },
            }
          : {
              tone: "bad",
              text: {
                en: "Highlights are heavily clipped. Lower Contrast (often the default of 50–75 is right) and check the RGB range tip from the black level step.",
                tr: "Parlak tonlar ciddi şekilde kırpılıyor. Kontrastı düşürün (çoğu zaman 50–75 arasındaki varsayılan değer doğrudur) ve siyah seviyesi adımındaki RGB aralığı önerisini kontrol edin.",
              },
            },
  },
  {
    id: "gamma",
    title: { en: "Gamma", tr: "Gama" },
    patternId: "gamma",
    variant: 0,
    controls: { en: "Gamma mode", tr: "Gama modu (Gamma)" },
    instructions: (t) => [
      {
        en: "Sit back or squint so the fine lines blur together.",
        tr: "İnce çizgiler birbirine karışacak şekilde biraz geri çekilin ya da gözlerinizi hafifçe kısın.",
      },
      {
        en: "Find the bar where the center patch blends best into its striped surroundings.",
        tr: "Ortadaki düz renkli alanın, çevresindeki çizgili bölgeyle en iyi kaynaştığı sütunu bulun.",
      },
      {
        en: `Your target gamma is ${g(t)}. If it's off, try another Gamma mode in the monitor menu (e.g. 'Gamma 2', 'Mode 2', '2.2').`,
        tr: `Hedef gama değeriniz ${g(t)}. Sonuç farklıysa monitör menüsünden başka bir gama modu deneyin (ör. 'Gamma 2', 'Mode 2', '2.2').`,
      },
    ],
    question: { en: "Which bar blends best?", tr: "Hangi sütun en iyi kaynaşıyor?" },
    options: ["1.8", "2.0", "2.2", "2.4", "2.6"].map((v) => ({ id: v, label: { en: v, tr: v } })),
    advise: (a, t) => {
      const diff = parseFloat(a) - t.gamma;
      if (Math.abs(diff) < 0.15)
        return {
          tone: "good",
          text: {
            en: `Right on target (${g(t)}). Midtones look as intended.`,
            tr: `Gama tam hedefte (${g(t)}). Ara tonlar olması gerektiği gibi görünüyor.`,
          },
        };
      return diff < 0
        ? {
            tone: "warn",
            text: {
              en: `Gamma is low, so the image looks flat or washed out. Choose a higher Gamma mode in the monitor menu, aiming for ${g(t)}.`,
              tr: `Gama düşük; bu yüzden görüntü soluk ve donuk görünüyor. Monitör menüsünden daha yüksek bir gama modu seçin. Hedef: ${g(t)}.`,
            },
          }
        : {
            tone: "warn",
            text: {
              en: `Gamma is high, so midtones and shadows look too dark. Choose a lower Gamma mode, aiming for ${g(t)}.`,
              tr: `Gama yüksek; bu yüzden ara tonlar ve gölgeler fazla koyu görünüyor. Daha düşük bir gama modu seçin. Hedef: ${g(t)}.`,
            },
          };
    },
  },
  {
    id: "gray",
    title: { en: "Color balance", tr: "Renk dengesi" },
    patternId: "grayscale",
    controls: {
      en: "Color Temperature, RGB Gain",
      tr: "Renk Sıcaklığı (Color Temperature), RGB Kazancı (RGB Gain)",
    },
    instructions: (t) => [
      { en: "Look at the gray steps and the ramp at the bottom.", tr: "Gri basamaklara ve alttaki geçiş şeridine bakın." },
      {
        en: `Grays should look neutral. The standard white point is ${t.whitePoint}, often called 'Normal', '6500K' or 'sRGB' in monitor menus.`,
        tr: `Griler nötr görünmeli. Standart beyaz noktası ${t.whitePoint} olarak kabul edilir; monitör menülerinde genellikle 'Normal', '6500K' veya 'sRGB' adıyla geçer.`,
      },
      {
        en: "Give your eyes a few seconds to adapt before judging.",
        tr: "Karar vermeden önce gözlerinizin alışması için birkaç saniye bekleyin.",
      },
    ],
    question: { en: "How do the grays look?", tr: "Griler nasıl görünüyor?" },
    options: [
      { id: "neutral", label: { en: "Neutral", tr: "Nötr" } },
      { id: "blue", label: { en: "Bluish / cold", tr: "Mavimsi (soğuk)" } },
      { id: "yellow", label: { en: "Yellowish / warm", tr: "Sarımsı (sıcak)" } },
      { id: "green", label: { en: "Greenish", tr: "Yeşilimsi" } },
      { id: "pink", label: { en: "Pinkish", tr: "Pembemsi" } },
    ],
    advise: (a) => {
      switch (a) {
        case "neutral":
          return {
            tone: "good",
            text: { en: "Neutral grays. Your color temperature is well balanced.", tr: "Griler nötr. Renk sıcaklığınız dengeli." },
          };
        case "blue":
          return {
            tone: "warn",
            text: {
              en: "Too cool. Pick the 'Warm', 'Normal' or '6500K' color temperature, or lower Blue gain slightly in User mode.",
              tr: "Görüntü fazla soğuk. Renk sıcaklığını 'Warm' (Sıcak), 'Normal' veya '6500K' yapın ya da Kullanıcı (User) modunda mavi kazancını biraz düşürün.",
            },
          };
        case "yellow":
          return {
            tone: "warn",
            text: {
              en: "Too warm. Pick 'Normal' or '6500K', or lower Red gain slightly in User mode. (Night light and blue light filters also do this; turn them off for now.)",
              tr: "Görüntü fazla sıcak. 'Normal' veya '6500K' seçin ya da Kullanıcı (User) modunda kırmızı kazancını biraz düşürün. Gece ışığı ve mavi ışık filtreleri de bu etkiyi yaratır; şimdilik bunları kapatın.",
            },
          };
        case "green":
          return {
            tone: "warn",
            text: {
              en: "Green tint. In User / Custom color mode, lower Green gain a few steps.",
              tr: "Görüntüde yeşil bir ton var. Kullanıcı / Özel renk modunda yeşil kazancını birkaç kademe düşürün.",
            },
          };
        default:
          return {
            tone: "warn",
            text: {
              en: "Magenta tint. In User / Custom color mode, raise Green gain a little or lower Red and Blue slightly.",
              tr: "Görüntüde pembe (macenta) bir ton var. Kullanıcı / Özel renk modunda yeşil kazancını biraz artırın ya da kırmızı ve maviyi hafifçe düşürün.",
            },
          };
      }
    },
  },
  {
    id: "sharpness",
    title: { en: "Sharpness", tr: "Keskinlik" },
    patternId: "sharpness",
    controls: { en: "Sharpness", tr: "Keskinlik (Sharpness)" },
    instructions: () => [
      {
        en: "Look closely at the edges of the black and white blocks and the fine lines.",
        tr: "Siyah ve beyaz blokların kenarlarına ve ince çizgilere yakından bakın.",
      },
      {
        en: "Bright or dark outlines around edges (halos) mean the monitor is over-sharpening.",
        tr: "Kenarların çevresinde açık veya koyu çizgiler (hale) görüyorsanız monitör görüntüyü gereğinden fazla keskinleştiriyordur.",
      },
    ],
    question: { en: "How do the edges look?", tr: "Kenarlar nasıl görünüyor?" },
    options: [
      { id: "clean", label: { en: "Clean and crisp", tr: "Temiz ve net" } },
      { id: "halo", label: { en: "Halos around edges", tr: "Kenarlarda hale var" } },
      { id: "blurry", label: { en: "Soft or blurry", tr: "Yumuşak veya bulanık" } },
    ],
    advise: (a) =>
      a === "clean"
        ? { tone: "good", text: { en: "Sharpness is neutral. Keep it.", tr: "Keskinlik nötr. Bu ayarı koruyun." } }
        : a === "halo"
          ? {
              tone: "warn",
              text: {
                en: "Lower Sharpness until the halos disappear. The neutral point is often 0, 50 or the default value.",
                tr: "Haleler kaybolana kadar keskinliği düşürün. Nötr değer genellikle 0, 50 ya da varsayılan değerdir.",
              },
            }
          : {
              tone: "warn",
              text: {
                en: "Check that your OS uses the display's native resolution. If it does, raise Sharpness one step at a time but stop before halos appear.",
                tr: "İşletim sisteminizin ekranın doğal çözünürlüğünü kullandığını kontrol edin. Kullanıyorsa keskinliği kademe kademe artırın; hale oluşmaya başlamadan durun.",
              },
            },
  },
  {
    id: "gradients",
    title: { en: "Smoothness", tr: "Geçiş yumuşaklığı" },
    patternId: "gradients",
    controls: { en: "Picture enhancers, GPU color depth", tr: "Görüntü iyileştiriciler, ekran kartı renk derinliği" },
    instructions: () => [
      {
        en: "Each color ramp should flow smoothly from dark to bright, without steps or stripes.",
        tr: "Her renk şeridi koyudan açığa, basamak ya da çizgi olmadan yumuşakça geçmeli.",
      },
    ],
    question: { en: "Do you see banding?", tr: "Bantlanma görüyor musunuz?" },
    options: [
      { id: "smooth", label: { en: "Smooth", tr: "Yumuşak" } },
      { id: "slight", label: { en: "Slight steps", tr: "Hafif basamaklar var" } },
      { id: "strong", label: { en: "Clear stripes", tr: "Belirgin şeritler var" } },
    ],
    advise: (a) =>
      a === "smooth"
        ? { tone: "good", text: { en: "Smooth gradients.", tr: "Geçişler yumuşak." } }
        : a === "slight"
          ? {
              tone: "good",
              text: {
                en: "Slight banding is common on many monitors and usually not noticeable in real content.",
                tr: "Hafif bantlanma birçok monitörde görülür ve gerçek içerikte genellikle fark edilmez.",
              },
            }
          : {
              tone: "warn",
              text: {
                en: "Turn off picture enhancers (dynamic contrast, super resolution, noise reduction). In GPU settings, use the highest color depth (8 or 10 bpc) and RGB output.",
                tr: "Görüntü iyileştirme özelliklerini (dinamik kontrast, süper çözünürlük, gürültü azaltma) kapatın. Ekran kartı ayarlarında en yüksek renk derinliğini (8 veya 10 bpc) ve RGB çıkışını seçin.",
              },
            },
  },
  {
    id: "motion",
    title: { en: "Motion", tr: "Hareket" },
    patternId: "motion",
    variant: 1,
    optional: true,
    controls: { en: "Overdrive / Response Time", tr: "Overdrive / Tepki Süresi (Response Time)" },
    instructions: () => [
      { en: "Follow the moving object with your eyes.", tr: "Hareket eden nesneyi gözlerinizle takip edin." },
      {
        en: "Try each Overdrive / Response Time level in the monitor menu and pick the one with the cleanest edges.",
        tr: "Monitör menüsündeki her Overdrive / Tepki Süresi seviyesini deneyin ve kenarların en temiz göründüğü seviyeyi seçin.",
      },
    ],
    question: { en: "What trails behind the object?", tr: "Nesnenin arkasında ne görüyorsunuz?" },
    options: [
      { id: "clean", label: { en: "Clean edges", tr: "Temiz kenarlar" } },
      { id: "dark", label: { en: "Dark smear", tr: "Koyu bir iz" } },
      { id: "bright", label: { en: "Bright or colored halo", tr: "Parlak veya renkli bir hale" } },
      { id: "skip", label: { en: "Skip", tr: "Atla" } },
    ],
    advise: (a) =>
      a === "clean"
        ? { tone: "good", text: { en: "Overdrive is well tuned.", tr: "Overdrive iyi ayarlanmış." } }
        : a === "skip"
          ? { tone: "good", text: { en: "Motion check skipped.", tr: "Hareket testi atlandı." } }
          : a === "dark"
            ? {
                tone: "warn",
                text: {
                  en: "That's ghosting. Raise Overdrive / Response Time one level.",
                  tr: "Bu, gölgelenme (ghosting) etkisidir. Overdrive / Tepki Süresi ayarını bir seviye artırın.",
                },
              }
            : {
                tone: "warn",
                text: {
                  en: "That's overshoot. Lower Overdrive / Response Time one level.",
                  tr: "Bu, aşma (overshoot) etkisidir. Overdrive / Tepki Süresi ayarını bir seviye düşürün.",
                },
              },
  },
];
