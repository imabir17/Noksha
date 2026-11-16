export type PillarId = "light-shades" | "nakshi-kantha" | "jewelry-boxes";

export type ProductStatus = "ready" | "limited" | "waitlist";

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface NokshaProduct {
  id: string;
  name: string;
  bengaliName: string;
  category: PillarId;
  priceBDT: number;
  originalPriceBDT?: number;
  status: ProductStatus;
  statusLabel: string;
  region: string;
  artisanHours: number;
  artisanHoursLabel: string;
  materials: string;
  dimensions: string;
  story: string;
  care: string;
  image: string;
  accentColor: string;
  colors: ColorSwatch[];
}

export interface FoundingPillar {
  id: PillarId;
  title: string;
  bengaliTitle: string;
  subtitle: string;
  origin: string;
  craftMetric: string;
  description: string;
  priceRange: string;
  accentHex: string;
  bgTintHex: string;
  borderHex: string;
  heroImage: string;
  highlightTag: string;
}

export interface ArtisanGuild {
  id: string;
  pillarId: PillarId;
  region: string;
  bengaliRegion: string;
  guildName: string;
  craftForm: string;
  leadArtisanNote: string;
  tools: string[];
  processSteps: string[];
  pledge: string;
  accentHex: string;
}

export interface LaunchMilestone {
  batch: string;
  bengaliLabel: string;
  title: string;
  timing: string;
  state: "live" | "waitlist" | "bespoke";
  summary: string;
  highlights: string[];
}

export const PROMO_CODES: Record<string, { discountRate: number; label: string }> = {
  SHUVO10: {
    discountRate: 0.1,
    label: "10% Inaugural Launch Privilege",
  },
};

export const BANGLADESH_DISTRICTS = [
  "Dhaka",
  "Chattogram",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Rangpur",
  "Mymensingh",
];

export const FOUNDING_PILLARS: FoundingPillar[] = [
  {
    id: "light-shades",
    title: "Alo-Chhaya Light Shades",
    bengaliTitle: "আলোর ছায়া",
    subtitle: "Sculptural Bamboo, Jamdani & Terracotta Lighting",
    origin: "Dhamrai & Bogura Guilds",
    craftMetric: "32–65 Hours Hand-Woven",
    description:
      "Suspended lanterns and table lamps shaped from seasoned Sylheti cane, curved golden bamboo ribs, translucent Jamdani cotton, and hand-pierced terracotta jali that paint living Alpona shadows across evening rooms.",
    priceRange: "৳ 4,850 – ৳ 9,400",
    accentHex: "#B9772C",
    bgTintHex: "#FDF3E3",
    borderHex: "#E6C975",
    heroImage: "/images/light-jamdani-pendant.png",
    highlightTag: "Warm Shadow-Play",
  },
  {
    id: "nakshi-kantha",
    title: "Heirloom Nakshi Kanthas",
    bengaliTitle: "নকশিকাঁথা",
    subtitle: "Hand-Stitched Story Quilts in Silk & Kora Cotton",
    origin: "Jamalpur & Jessore Women's Collectives",
    craftMetric: "140–280 Hours of Running Stitch",
    description:
      "Layered unbleached kora cotton and tussar silk quilted entirely by hand using millennia-old kantha phor ripples—narrating Padma lotuses, monsoon peacocks, and auspicious rural blessings in alta crimson and gold.",
    priceRange: "৳ 9,800 – ৳ 18,500",
    accentHex: "#8C2F2F",
    bgTintHex: "#FCEEEF",
    borderHex: "#E3A7AF",
    heroImage: "/images/kantha-crimson-padma.png",
    highlightTag: "Signed by Master Stitcher",
  },
  {
    id: "jewelry-boxes",
    title: "Oshongkar Jewelry Boxes",
    bengaliTitle: "কাঠের গহনার বাক্স",
    subtitle: "Hand-Carved Timber & Alpona Brass Chests",
    origin: "Chattogram & Sylhet Master Carvers",
    craftMetric: "45–90 Hours Hand-Inlaid",
    description:
      "Seasoned solid hardwood chests lined with plush alta velvet and crowned with recessed brass Alpona motifs—crafted to safeguard bridal gold, jamdani pins, and generational keepsakes.",
    priceRange: "৳ 5,200 – ৳ 12,800",
    accentHex: "#2F5D58",
    bgTintHex: "#E6F2F0",
    borderHex: "#9ED0CA",
    heroImage: "/images/box-teak-brass.png",
    highlightTag: "Heirloom Timber & Velvet",
  },
];

export const NOKSHA_PRODUCTS: NokshaProduct[] = [
  // 1. Light Shades
  {
    id: "alo-jamdani-pendant",
    name: "Sonargaon Jamdani & Bamboo Dome Shade",
    bengaliName: "সোনারগাঁও জামদানি আলোর ছায়া",
    category: "light-shades",
    priceBDT: 6450,
    originalPriceBDT: 7200,
    status: "ready",
    statusLabel: "Founding Batch #01",
    region: "Dhamrai & Narayanganj",
    artisanHours: 48,
    artisanHoursLabel: "48 Hours Hand-Woven",
    materials: "Seasoned golden bamboo ribs, unbleached Jamdani cotton muslin, brushed brass canopy",
    dimensions: "Diameter 44 cm × Height 34 cm • 1.5m braided cotton cord included",
    story:
      "A dialogue between two riverine crafts: flexible bamboo split by Bogura weavers forms an airy lotus dome wrapped in hand-loomed Jamdani muslin with subtle crimson and gold geometric motifs. When lit, it bathes dining tables and verandas in soft golden warmth.",
    care: "Dust gently with a dry ostrich-feather brush or soft muslin cloth; use warm-white LED bulbs (2700K, up to 15W).",
    image: "/images/light-jamdani-pendant.png",
    accentColor: "#B9772C",
    colors: [
      { name: "Kora Ivory & Alta", hex: "#F5EDE0" },
      { name: "Shonar Gold Weave", hex: "#C59B27" },
    ],
  },
  {
    id: "alo-terracotta-jali",
    name: "Padma Terracotta & Brass Jali Table Lantern",
    bengaliName: "পদ্মা পোড়ামাটি জালি বাতি",
    category: "light-shades",
    priceBDT: 4850,
    status: "limited",
    statusLabel: "Only 3 Left",
    region: "Dhamrai & Bogura",
    artisanHours: 36,
    artisanHoursLabel: "36 Hours Hand-Pierced",
    materials: "Kiln-fired Bengal alluvial terracotta clay, hand-hammered kansa brass collar",
    dimensions: "Diameter 24 cm × Height 31 cm • Warm E27 brass bulb holder & switch",
    story:
      "Thrown on a traditional potter's wheel and pierced while leather-hard with a fine steel stylus, each lotus-petal perforation projects serene Alpona constellations onto surrounding cream walls.",
    care: "Wipe brass collar with a dry soft cloth; keep terracotta interior dry and dust with a soft brush.",
    image: "/images/light-terracotta-jali.png",
    accentColor: "#9A4A2F",
    colors: [
      { name: "Terracotta Clay", hex: "#C65D3B" },
      { name: "Burnished Kansa", hex: "#C59B27" },
    ],
  },
  {
    id: "alo-veranda-chandelier",
    name: "Barandah Tiered Cane & Brass Pendant",
    bengaliName: "বারান্দা বেত ও পিতলের ঝাড়",
    category: "light-shades",
    priceBDT: 9400,
    status: "waitlist",
    statusLabel: "Batch #02 Waitlist",
    region: "Sylhet & Dhamrai",
    artisanHours: 65,
    artisanHoursLabel: "65 Hours Artisan Craft",
    materials: "Split Sylheti rattan cane, hand-spun brass rings, cream cotton diffuser",
    dimensions: "Diameter 54 cm × Height 48 cm • Adjustable brass downrod",
    story:
      "Inspired by the breezy verandas of old Dhaka heritage residences, double-tiered cane weaving softens glare into an intimate golden halo suited for foyers and high-ceiling lounges.",
    care: "Brush gently along the cane grain; avoid damp outdoor exposure.",
    image: "/images/hero-courtyard.png",
    accentColor: "#B08A4F",
    colors: [
      { name: "Natural Rattan", hex: "#D6AE6F" },
      { name: "Antique Brass", hex: "#C59B27" },
    ],
  },

  // 2. Nakshi Kanthas
  {
    id: "kantha-alta-padma",
    name: "Rajshahi Alta Padma Heirloom Kantha",
    bengaliName: "আলতা পদ্ম নকশিকাঁথা",
    category: "nakshi-kantha",
    priceBDT: 15800,
    originalPriceBDT: 17500,
    status: "ready",
    statusLabel: "Founding Batch #01",
    region: "Jamalpur Guild",
    artisanHours: 220,
    artisanHoursLabel: "220+ Hours Hand-Stitched",
    materials: "4-ply handloom kora cotton, mercerized cotton embroidery threads in alta crimson & marigold",
    dimensions: "King Throw / Quilt • 228 cm × 260 cm (90 in × 102 in)",
    story:
      "Centered around a thousand-petal Padma lotus mandala bordered by mango-paisley (Kalka) vines and rhythmic wave stitches. Five master women artisans in Jamalpur worked in unison over six weeks to sign this singular heirloom.",
    care: "Dry clean recommended for first wash; subsequently gentle cold hand-wash with mild soap and shade dry flat.",
    image: "/images/kantha-crimson-padma.png",
    accentColor: "#8C2F2F",
    colors: [
      { name: "Alta Crimson", hex: "#B8293D" },
      { name: "Marigold Gold", hex: "#E08E1B" },
      { name: "Kora Ivory", hex: "#FAF6F0" },
    ],
  },
  {
    id: "kantha-mayur-emerald",
    name: "Moyurakshi Emerald & Ivory Peacock Kantha",
    bengaliName: "ময়ূরাক্ষী সবুজ নকশিকাঁথা",
    category: "nakshi-kantha",
    priceBDT: 13200,
    status: "ready",
    statusLabel: "One of One",
    region: "Jessore & Jamalpur",
    artisanHours: 175,
    artisanHoursLabel: "175 Hours Hand-Stitched",
    materials: "Breathable organic kora cotton, Padma emerald teal, vermilion & mustard embroidery floss",
    dimensions: "Queen Coverlet / Sofa Throw • 190 cm × 235 cm (75 in × 92 in)",
    story:
      "Celebrating the monsoon gardens of Bengal, pairs of stylized peacocks frame cascading river-ripple running stitches in deep Padma emerald and vermilion accents.",
    care: "Gentle hand-wash separately in cold water or dry clean; press lightly on reverse through muslin.",
    image: "/images/kantha-peacock-emerald.png",
    accentColor: "#2F5D58",
    colors: [
      { name: "Padma Emerald", hex: "#166962" },
      { name: "Sindoor Red", hex: "#B8293D" },
      { name: "Mustard", hex: "#C59B27" },
    ],
  },
  {
    id: "kantha-tussar-bridal",
    name: "Shonar Bangla Bridal Silk-Blend Kantha",
    bengaliName: "সোনার বাংলা রেশম কাঁথা",
    category: "nakshi-kantha",
    priceBDT: 18500,
    status: "waitlist",
    statusLabel: "Batch #02 Waitlist",
    region: "Jamalpur Master Collective",
    artisanHours: 280,
    artisanHoursLabel: "280 Hours Couture Stitch",
    materials: "Rajshahi tussar silk face, fine malmal cotton backing, gold-dyed cotton threadwork",
    dimensions: "Grand Heirloom Quilt • 235 cm × 270 cm (92 in × 106 in)",
    story:
      "Commissioned as a wedding trousseau centerpiece, depicting palki processions, flowering kadam trees, and concentric Alpona rings stitched on luminous ivory tussar silk.",
    care: "Specialist dry clean only; store folded in the complimentary Noksha kora muslin preservation bag.",
    image: "/images/kantha-crimson-padma.png",
    accentColor: "#B08A4F",
    colors: [
      { name: "Tussar Gold", hex: "#D4AF37" },
      { name: "Alta Crimson", hex: "#B8293D" },
    ],
  },

  // 3. Wooden Jewelry Boxes
  {
    id: "box-teak-brass",
    name: "Shegun & Kansa Alpona Inlay Jewelry Chest",
    bengaliName: "সেগুন কাঠ ও কাঁসার গহনার বাক্স",
    category: "jewelry-boxes",
    priceBDT: 7800,
    originalPriceBDT: 8600,
    status: "ready",
    statusLabel: "Founding Batch #01",
    region: "Chattogram Master Carvers",
    artisanHours: 64,
    artisanHoursLabel: "64 Hours Hand-Inlaid",
    materials: "Kiln-seasoned Chittagong shegun teak, solid brass Alpona wire inlay, alta crimson silk-velvet lining",
    dimensions: "28 cm × 20 cm × 11.5 cm • 6 necklace/bangle bays & ring rolls",
    story:
      "Chiseled from heartwood Chittagong teak and inlaid flush with hand-cut brass Alpona lotus and paisley filigree. Lifts smoothly on concealed brass quadrant hinges to unveil soft crimson velvet bays designed for Polki, Sitahar, and pearl heirlooms.",
    care: "Buff wood surface occasionally with pure beeswax and a dry lint-free cloth; avoid direct sunlight.",
    image: "/images/box-teak-brass.png",
    accentColor: "#2F5D58",
    colors: [
      { name: "Chattogram Teak", hex: "#7A4B2A" },
      { name: "Alta Velvet Interior", hex: "#B8293D" },
    ],
  },
  {
    id: "box-rosewood-alpona",
    name: "Padmaboti Multi-Tier Rosewood & Kadam Chest",
    bengaliName: "পদ্মাবতী নকশাদার রত্ন পেটিকা",
    category: "jewelry-boxes",
    priceBDT: 11900,
    status: "limited",
    statusLabel: "Only 2 Left",
    region: "Chattogram & Sonargaon",
    artisanHours: 88,
    artisanHoursLabel: "88 Hours Hand-Carved",
    materials: "Aged Bengal rosewood, pale kadam wood drawers, hand-painted mineral gold & vermilion Alpona",
    dimensions: "32 cm × 22 cm × 18 cm • Upper lift-out tray + 2 velvet-lined drawers",
    story:
      "A miniature architectural cabinet echoing heritage Bengali zamindari dressing chests—crowned with hand-painted Alpona botanicals and solid cast-brass lotus pulls.",
    care: "Wipe painted lid gently with a dry microfibre cloth only; keep away from moisture.",
    image: "/images/box-rosewood-alpona.png",
    accentColor: "#8C2F2F",
    colors: [
      { name: "Aged Rosewood", hex: "#5B3228" },
      { name: "Kadam & Gold Motif", hex: "#C59B27" },
    ],
  },
  {
    id: "box-kadam-sindoor",
    name: "Kadam Bridal Sindoor & Ring Keepsake Trio",
    bengaliName: "কদম কাঠের শঙ্খ-সিঁদুর কৌটা",
    category: "jewelry-boxes",
    priceBDT: 5200,
    status: "waitlist",
    statusLabel: "Batch #02 Waitlist",
    region: "Sylhet & Chattogram",
    artisanHours: 45,
    artisanHoursLabel: "45 Hours Turned & Painted",
    materials: "Hand-turned aromatic kadam wood, emerald & gold lacquer-free folk brushwork, brass clasp",
    dimensions: "Main Chest 21 cm × 15 cm × 9 cm + Matching Turned Sindoor Bowl",
    story:
      "Thoughtfully proportioned for wedding mornings and intimate bedside tables, pairing an emerald-trimmed carved kadam casket with a matching turned keepsake bowl.",
    care: "Keep interior clean with a dry soft brush; apply beeswax only on exterior unpainted timber.",
    image: "/images/box-rosewood-alpona.png",
    accentColor: "#2F5D58",
    colors: [
      { name: "Pale Kadam", hex: "#DFC39D" },
      { name: "Padma Emerald Trim", hex: "#166962" },
    ],
  },
];

export const ARTISAN_GUILDS: ArtisanGuild[] = [
  {
    id: "guild-jamalpur",
    pillarId: "nakshi-kantha",
    region: "Jamalpur & Jessore",
    bengaliRegion: "জামালপুর ও যশোর",
    guildName: "Noksha Women's Kantha Collective",
    craftForm: "Running-Stitch Embroidery (কাঁথা ফোঁড়)",
    leadArtisanNote:
      "\"Each ripple stitch must breathe with the weave of the cotton—if you pull too tight, the story loses its softness.\"",
    tools: ["Fine steel needle (সুই)", "Wooden tracing blocks", "Natural indigo & madder-inspired cotton thread"],
    processSteps: [
      "Four layers of handloom kora cotton are basted flat on courtyard mats.",
      "Master designers sketch Padma lotuses, peacocks, and kalka borders freehand.",
      "Artisans stitch for 4 to 8 weeks, signing each border with distinctive ripple geometry.",
    ],
    pledge: "Fair direct-to-artisan wages + signed provenance card inside every kantha.",
    accentHex: "#8C2F2F",
  },
  {
    id: "guild-dhamrai",
    pillarId: "light-shades",
    region: "Dhamrai, Bogura & Narayanganj",
    bengaliRegion: "ধামরাই ও বগুড়া",
    guildName: "Alo-Chhaya Bamboo, Terracotta & Loom Guild",
    craftForm: "Architectural Cane, Jamdani & Pierced Clay",
    leadArtisanNote:
      "\"A Bangladeshi lamp is never about harsh brightness—it is about evening breeze, dappled shadows, and hospitality.\"",
    tools: ["Curved dao splitting knives", "Potter's wheel & brass piercing styluses", "Pit-loom Jamdani shuttles"],
    processSteps: [
      "Seasoned bamboo and Sylheti cane are smoked over neem smoke for natural longevity.",
      "Translucent Jamdani muslin is hand-wrapped or clay domes are perforated by hand.",
      "Every shade is fitted with safe UL/CE-grade braided cotton wiring in our Dhaka studio.",
    ],
    pledge: "100% locally harvested bamboo, cane, and river clay from northern & central Bengal.",
    accentHex: "#B9772C",
  },
  {
    id: "guild-chattogram",
    pillarId: "jewelry-boxes",
    region: "Chattogram & Sylhet",
    bengaliRegion: "চট্টগ্রাম ও সিলেট",
    guildName: "Oshongkar Fine Timber & Brass Guild",
    craftForm: "Teak Joinery, Brass Wire Inlay & Alpona Brushwork",
    leadArtisanNote:
      "\"Wood seasoned slowly remembers the forest; brass inlay turns a box into an heirloom your granddaughter will open.\"",
    tools: ["Fine chisels (বাটালি)", "Hand-rolled kansa brass wire", "Mineral pigments & natural beeswax"],
    processSteps: [
      "Reclaimed and sustainably felled Chittagong teak is air-seasoned for months to prevent warping.",
      "Alpona lotus channels are hand-chiselled, packed with solid brass inlay, and sanded mirror-smooth.",
      "Interiors are lined by hand with cushiony alta-crimson and emerald silk-velvet bays.",
    ],
    pledge: "Zero MDF or synthetic veneer—only solid Bengal hardwood and solid brass hardware.",
    accentHex: "#2F5D58",
  },
];

export const LAUNCH_ROADMAP: LaunchMilestone[] = [
  {
    batch: "Batch 01 • Live Now",
    bengaliLabel: "প্রথম সম্ভার",
    title: "Inaugural Founding Collection",
    timing: "Available for Immediate Dhaka & Nationwide Dispatch",
    state: "live",
    summary:
      "Our debut release of woven light shades, hand-stitched Nakshi Kanthas, and inlaid teak jewellery chests—ready to ship in complimentary muslin wrapping.",
    highlights: ["6 Core Signatures Ready to Ship", "10% Privilege via Code SHUVO10", "Numbered Certificate of Authenticity"],
  },
  {
    batch: "Batch 02 • Waitlist Open",
    bengaliLabel: "দ্বিতীয় সম্ভার",
    title: "Festival & Bridal Reserve Drop",
    timing: "Pre-Reserve Open • Shipping in 3 Weeks",
    state: "waitlist",
    summary:
      "Limited collector pieces currently being prepared for our next release: tiered cane chandeliers, tussar bridal kanthas, and turned kadam sindoor trios.",
    highlights: ["Priority Allocation for Waitlist Collectors", "Zero Advance Payment Required to Reserve", "48-Hour Early Preview Link"],
  },
  {
    batch: "Atelier Bespoke",
    bengaliLabel: "বিশেষ ফরমায়েশ",
    title: "Custom Interior & Bridal Commissions",
    timing: "Online & WhatsApp Consultations",
    state: "bespoke",
    summary:
      "Collaborate with Noksha curators for custom dining-room light installations, monogrammed heirloom wedding kanthas, or bespoke engraved family jewelry chests.",
    highlights: ["Custom Dimensions & Motifs", "Direct Guild Collaboration", "White-Glove Dhaka Installation"],
  },
];

export function formatBDT(amount: number): string {
  return `৳ ${amount.toLocaleString("en-IN")}`;
}
