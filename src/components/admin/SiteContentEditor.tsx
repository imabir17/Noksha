"use client";

import React, { useState } from "react";
import { Image as ImageIcon, RotateCcw, Save, Upload } from "lucide-react";

type ContentSection =
  | "hero"
  | "manifesto"
  | "atelier"
  | "about"
  | "drops_shop"
  | "brand_footer";

interface SiteContentEditorProps {
  contentDraft: Record<string, string>;
  setContentDraft: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onPublish: () => void;
  notify: (msg: string) => void;
  inputCls: string;
  cardCls: string;
}

const SECTION_TABS: { id: ContentSection; label: string }[] = [
  { id: "hero", label: "1. Announcement & Hero" },
  { id: "manifesto", label: "2. Manifesto & Store Intros" },
  { id: "atelier", label: "3. Atelier & Founding Circle" },
  { id: "about", label: "4. About Page" },
  { id: "drops_shop", label: "5. Drops & Shop Pages" },
  { id: "brand_footer", label: "6. Brand Logos, Footer & Delivery" },
];

export default function SiteContentEditor({
  contentDraft,
  setContentDraft,
  onPublish,
  notify,
  inputCls,
  cardCls,
}: SiteContentEditorProps) {
  const [section, setSection] = useState<ContentSection>("hero");
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const val = (key: string, fallback = "") =>
    contentDraft[key] !== undefined ? contentDraft[key] : fallback;

  const setKey = (key: string, value: string) => {
    setContentDraft((prev) => ({ ...prev, [key]: value }));
  };

  const uploadImage = async (key: string, file?: File) => {
    if (!file) return;
    setUploadingKey(key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const out = await res.json();
      if (res.ok && out.url) {
        setKey(key, out.url);
        notify("Image uploaded and attached!");
      } else {
        notify(out.error || "Upload failed");
      }
    } catch {
      notify("Upload error");
    } finally {
      setUploadingKey(null);
    }
  };

  const renderText = (
    key: string,
    label: string,
    fallback: string,
    opts?: { rows?: number; colSpan2?: boolean; mono?: boolean; placeholder?: string }
  ) => (
    <div className={opts?.colSpan2 ? "md:col-span-2" : ""}>
      <div className="flex items-center justify-between mb-1">
        <label className="block font-bold text-[#14110F]">{label}</label>
        {contentDraft[key] !== undefined && contentDraft[key] !== fallback && (
          <button
            type="button"
            onClick={() => setKey(key, fallback)}
            className="text-[11px] font-bold text-[#7A5417] hover:underline inline-flex items-center gap-1 cursor-pointer"
            title="Reset to default"
          >
            <RotateCcw className="w-3 h-3" /> Default
          </button>
        )}
      </div>
      {opts?.rows ? (
        <textarea
          rows={opts.rows}
          value={val(key, fallback)}
          onChange={(e) => setKey(key, e.target.value)}
          placeholder={opts?.placeholder || fallback}
          className={inputCls}
        />
      ) : (
        <input
          type="text"
          value={val(key, fallback)}
          onChange={(e) => setKey(key, e.target.value)}
          placeholder={opts?.placeholder || fallback}
          className={`${inputCls} ${opts?.mono ? "font-num" : ""}`}
        />
      )}
    </div>
  );

  const renderImage = (key: string, label: string, fallback: string) => {
    const src = val(key, fallback);
    return (
      <div className="md:col-span-2 flex flex-col sm:flex-row items-start gap-4 p-4 rounded-xl bg-[#FBF8F3] border border-[#D4C5B0]">
        <img
          src={src || fallback}
          alt={label}
          className="w-28 h-24 object-cover rounded-lg border border-[#B8A68E] bg-[#EFE7DA] shrink-0"
        />
        <div className="flex-1 w-full space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-bold text-[#14110F] flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#7A5417]" />
              {label}
            </label>
            {src !== fallback && (
              <button
                type="button"
                onClick={() => setKey(key, fallback)}
                className="text-[11px] font-bold text-[#7A5417] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset Default
              </button>
            )}
          </div>
          <input
            type="text"
            value={src}
            onChange={(e) => setKey(key, e.target.value)}
            placeholder={fallback}
            className={inputCls}
          />
          <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#2A1F18] hover:bg-[#4B3527] text-white text-xs font-bold cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-[#D8BF90]" />
            {uploadingKey === key ? "Uploading…" : "Upload New Image"}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => uploadImage(key, e.target.files?.[0])}
              className="hidden"
            />
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className={`${cardCls} p-6 space-y-6`}>
      {/* Header + Publish */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6DDD0] pb-4">
        <div>
          <h2 className="text-base font-bold text-[#14110F]">
            Complete Site Content &amp; Media CMS
          </h2>
          <p className="text-[13px] text-[#2D2620] font-medium mt-0.5">
            Edit every heading, paragraph, quote, badge, contact detail, and non-product image across the entire website.
          </p>
        </div>
        <button
          type="button"
          onClick={onPublish}
          className="px-5 py-2.5 bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] font-bold text-[13px] rounded-lg inline-flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Save className="w-4 h-4 text-[#D8BF90]" />
          Publish All Changes
        </button>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[#E6DDD0] pb-4">
        {SECTION_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSection(t.id)}
            className={`px-3.5 py-2 rounded-lg text-[12.5px] font-bold cursor-pointer transition-colors ${
              section === t.id
                ? "bg-[#2A1F18] text-white"
                : "bg-[#EFE7DA] text-[#14110F] hover:bg-[#E2D5C1]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. ANNOUNCEMENT & HERO */}
      {section === "hero" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
          <div className="md:col-span-2 flex items-center gap-3 p-3.5 rounded-lg bg-[#FBF8F3] border border-[#DED3C2]">
            <input
              type="checkbox"
              checked={contentDraft.announcement_enabled === "true"}
              onChange={(e) => setKey("announcement_enabled", e.target.checked ? "true" : "false")}
              className="accent-[#2A1F18] w-4 h-4"
            />
            <span className="font-bold text-[#14110F]">
              Show Top Announcement Banner on Storefront
            </span>
          </div>
          {renderText("announcement_text", "Top Announcement Banner Text", "Founding Batch No. 01 · Complimentary delivery over ৳ 8,000", { colSpan2: true })}
          {renderImage("hero_image", "Homepage Full-Screen Hero Image", "/images/hero-courtyard.png")}
          {renderText("hero_eyebrow", "Hero Eyebrow", "The Inaugural Collection")}
          {renderText("hero_bengali", "Hero Bengali Tagline", "আলো, সুতো ও কাঠের কাব্য")}
          {renderText("hero_title_line1", "Hero Headline Line 1", "Heirlooms for the")}
          {renderText("hero_title_line2", "Hero Headline Line 2 (Italic)", "Bengali home.")}
          {renderText("hero_cta_primary", "Hero Primary Button Label", "Discover the pieces")}
          {renderText("hero_cta_secondary", "Hero Secondary Link Label", "Our story")}
          {renderText("hero_index_1", "Hero Corner Index I", "I.  Alo — Light")}
          {renderText("hero_index_2", "Hero Corner Index II", "II.  Kantha — Thread")}
          {renderText("hero_index_3", "Hero Corner Index III", "III.  Shindook — Timber")}
        </div>
      )}

      {/* 2. MANIFESTO, CATEGORIES & STORE INTROS */}
      {section === "manifesto" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
          {renderText("manifesto_eyebrow", "Manifesto Eyebrow", "নকশা — meaning “design, pattern”", { colSpan2: true })}
          {renderText(
            "manifesto_body",
            "Manifesto Main Statement",
            "We began with three objects every Bengali home has always held dear — a lamp for the evening, a kantha for rest, and a carved box for what we cannot bear to lose. Each is made slowly, by hand, by Bangladeshi Artisans.",
            { rows: 3, colSpan2: true }
          )}
          {renderText("manifesto_stat_1_num", "Manifesto Stat 1 Number", "3", { mono: true })}
          {renderText("manifesto_stat_1_label", "Manifesto Stat 1 Label", "Craft categories")}
          {renderText("manifesto_stat_2_num", "Manifesto Stat 2 Number", "280", { mono: true })}
          {renderText("manifesto_stat_2_label", "Manifesto Stat 2 Label", "Hours in one kantha")}
          {renderText("manifesto_stat_3_num", "Manifesto Stat 3 Number", "100%", { mono: true })}
          {renderText("manifesto_stat_3_label", "Manifesto Stat 3 Label", "Made in Bangladesh")}

          <div className="md:col-span-2 border-t border-[#E6DDD0] pt-4 mt-2">
            <p className="font-bold text-[#7A5417] uppercase text-xs mb-3">
              Homepage Categories &amp; Store Section Headers
            </p>
          </div>
          {renderText("categories_eyebrow", "Categories Section Eyebrow", "The Categories")}
          {renderText("categories_title", "Categories Section Heading", "Three crafts, one house.")}
          {renderText(
            "categories_subtitle",
            "Categories Section Description",
            "Explore our signature craft categories—available as multi-piece store editions or as one-of-one collector pieces in our numbered Drops.",
            { rows: 2, colSpan2: true }
          )}
          {renderText("shop_eyebrow", "The Pieces Store Eyebrow", "Curated Store Categories")}
          {renderText("shop_title", "The Pieces Store Heading", "The pieces")}
          {renderText(
            "shop_subtitle",
            "The Pieces Store Subtitle",
            "Browse our signature store categories with multi-piece availability.",
            { rows: 2, colSpan2: true }
          )}
        </div>
      )}

      {/* 3. ATELIER, TENETS & FOUNDING CIRCLE */}
      {section === "atelier" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
          {renderImage("atelier_image", "Atelier Full-Bleed Craft Image", "/images/artisan-hands.jpg")}
          {renderText("atelier_eyebrow", "Atelier Eyebrow", "The Atelier")}
          {renderText("atelier_caption", "Atelier Image Caption", "Hand-stitched in Bangladesh")}
          {renderText(
            "atelier_quote",
            "Atelier Pull Quote",
            "“Pull the thread too tight and the story loses its softness.”",
            { rows: 2, colSpan2: true }
          )}

          {renderText("tenet_1_title", "House Tenet 01 Title", "A singular story")}
          {renderText(
            "tenet_1_body",
            "House Tenet 01 Description",
            "Every Nakshi Kantha is one of a kind — one design, stitched once, never repeated. Our light shades and carved chests are curated in small editions.",
            { rows: 2 }
          )}
          {renderText("tenet_2_title", "House Tenet 02 Title", "Honest materials")}
          {renderText(
            "tenet_2_body",
            "House Tenet 02 Description",
            "Handloom kora cotton, seasoned bamboo, alluvial terracotta, and solid Bengal hardwood with cast brass — never synthetic veneer.",
            { rows: 2 }
          )}
          {renderText("tenet_3_title", "House Tenet 03 Title", "Wrapped to keep")}
          {renderText(
            "tenet_3_body",
            "House Tenet 03 Description",
            "Each piece leaves our Dhaka studio wrapped in unbleached kora muslin with dried marigold.",
            { rows: 2 }
          )}

          <div className="md:col-span-2 border-t border-[#E6DDD0] pt-4 mt-2">
            <p className="font-bold text-[#7A5417] uppercase text-xs mb-3">
              Release Calendar &amp; Founding Circle Section
            </p>
          </div>
          {renderText("calendar_eyebrow", "Release Calendar Eyebrow", "Release calendar")}
          {renderText("calendar_title", "Release Calendar Heading", "Made in small numbers.")}
          {renderText("circle_eyebrow", "Founding Circle Eyebrow", "The Founding Circle")}
          {renderText("circle_title_line1", "Founding Circle Headline Line 1", "An invitation to")}
          {renderText("circle_title_line2", "Founding Circle Headline Line 2 (Italic)", "our first collectors.")}
          {renderText(
            "circle_body",
            "Founding Circle Invitation Body",
            "Private previews of each batch before release, early access to one-of-one Kanthas, and a founding courtesy on your first acquisition.",
            { rows: 2, colSpan2: true }
          )}
        </div>
      )}

      {/* 4. ABOUT PAGE */}
      {section === "about" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
          {renderImage("about_hero_image", "About Page Hero Banner Image", "/images/about-shital-pati.jpg")}
          {renderText("about_hero_eyebrow", "About Hero Eyebrow", "About Noksha · আমাদের গল্প")}
          {renderText("about_hero_bengali", "About Hero Bengali Tagline", "বাংলার ইতিহাস, নতুন প্রজন্মের গর্ব ও নারীর হাতের সম্মান")}
          {renderText("about_hero_title_1", "About Hero Headline Line 1", "Preserving our history.")}
          {renderText("about_hero_title_2", "About Hero Headline Line 2 (Italic)", "Empowering the hands that make it.")}

          <div className="md:col-span-2 border-t border-[#E6DDD0] pt-4 mt-2">
            <p className="font-bold text-[#7A5417] uppercase text-xs mb-3">Why We Started</p>
          </div>
          {renderText("about_why_eyebrow", "Why We Started Eyebrow", "Why We Started · কেন আমাদের শুরু")}
          {renderText("about_why_title", "Why We Started Heading", "Because a culture lives in what it chooses to keep.")}
          {renderText(
            "about_why_p1",
            "Why We Started — Paragraph 1",
            "Noksha (নকশা) began with a deeply personal question: as our homes become more modern, why must our own history and craftsmanship disappear from them?",
            { rows: 2, colSpan2: true }
          )}
          {renderText(
            "about_why_p2",
            "Why We Started — Paragraph 2",
            "We started Noksha to preserve the artistic heritage of Bangladesh, to inspire the younger generation to fall in love with their own cultural identity, and to work closely with Bangladeshi artisans and women—empowering them through dignified, meaningful craft.",
            { rows: 3, colSpan2: true }
          )}
          {renderText(
            "about_why_p3",
            "Why We Started — Paragraph 3",
            "Launching with three intimate pillars of the Bengali home—sculptural Alo light shades, one-of-one Nakshi Kanthas, and hand-carved wooden jewellery boxes—every piece we bring to life bridges memory and contemporary living.",
            { rows: 2, colSpan2: true }
          )}
          {renderText("about_stat_1_num", "About Stat 1 Number", "1 of 1", { mono: true })}
          {renderText("about_stat_1_label", "About Stat 1 Label", "Exclusive Kantha designs")}
          {renderText("about_stat_2_num", "About Stat 2 Number", "100%", { mono: true })}
          {renderText("about_stat_2_label", "About Stat 2 Label", "Bangladeshi craft")}
          {renderText("about_stat_3_num", "About Stat 3 Number", "3", { mono: true })}
          {renderText("about_stat_3_label", "About Stat 3 Label", "Founding home pillars")}

          <div className="md:col-span-2 border-t border-[#E6DDD0] pt-4 mt-2">
            <p className="font-bold text-[#7A5417] uppercase text-xs mb-3">Mission &amp; Vision</p>
          </div>
          {renderText(
            "about_mission_title",
            "Mission Headline",
            "To preserve Bangladeshi heritage, pass it to the next generation, and uplift the women and artisans behind every piece.",
            { rows: 2 }
          )}
          {renderText(
            "about_mission_body",
            "Mission Description",
            "Our mission is threefold: to safeguard traditional Bangladeshi craft forms through thoughtful design, to make our cultural stories desirable and relevant to young people today, and to empower women stitchers and master artisans by honoring their time, skill, and livelihood.",
            { rows: 3 }
          )}
          {renderText(
            "about_vision_title",
            "Vision Headline",
            "A world where Bangladeshi craft is celebrated as timeless luxury—and every maker thrives with pride.",
            { rows: 2 }
          )}
          {renderText(
            "about_vision_body",
            "Vision Description",
            "We envision Noksha as Bangladesh’s defining house of heirloom craft: where every young home cherishes objects rooted in Bengali culture, where no traditional stitch or carving is lost to time, and where women artisans across the country achieve lasting financial independence through their art.",
            { rows: 3 }
          )}

          <div className="md:col-span-2 border-t border-[#E6DDD0] pt-4 mt-2">
            <p className="font-bold text-[#7A5417] uppercase text-xs mb-3">Three Purpose Pillars (Text &amp; Images)</p>
          </div>
          {renderImage("about_pillar_1_image", "Purpose Pillar I Image", "/images/kantha-crimson-padma.png")}
          {renderText("about_pillar_1_eyebrow", "Pillar I Eyebrow", "Preserving History & Culture")}
          {renderText("about_pillar_1_bengali", "Pillar I Bengali", "ইতিহাস ও ঐতিহ্য সংরক্ষণ")}
          {renderText("about_pillar_1_title", "Pillar I Headline", "Keeping the soul of Bengal alive.", { colSpan2: true })}
          {renderText(
            "about_pillar_1_body",
            "Pillar I Body",
            "For generations, the artistry of Bangladesh has been written in thread, clay, bamboo, and timber—in the rippling kantha phor stitch, the lacy geometry of Alpona, and the warm shadow-play of woven lanterns. As mass production replaces handwork, these quiet traditions risk fading into memory. Noksha was founded to preserve this living heritage—not behind glass, but inside the homes we inhabit every day.",
            { rows: 3, colSpan2: true }
          )}

          {renderImage("about_pillar_2_image", "Purpose Pillar II Image", "/images/light-jamdani-pendant.png")}
          {renderText("about_pillar_2_eyebrow", "Pillar II Eyebrow", "Spreading Culture to the Younger Generation")}
          {renderText("about_pillar_2_bengali", "Pillar II Bengali", "নতুন প্রজন্মের কাছে বাংলার শেকড়")}
          {renderText("about_pillar_2_title", "Pillar II Headline", "Heirlooms reimagined for contemporary lives.", { colSpan2: true })}
          {renderText(
            "about_pillar_2_body",
            "Pillar II Body",
            "A culture endures only when the younger generation claims it as their own. We curate and craft pieces—sculptural light shades, one-of-a-kind Nakshi Kanthas, and hand-carved jewellery chests—that speak with quiet, modern refinement while remaining unmistakably Bangladeshi. Our goal is to make young collectors proud to live with, gift, and pass down the craft of their homeland.",
            { rows: 3, colSpan2: true }
          )}

          {renderImage("about_pillar_3_image", "Purpose Pillar III Image", "/images/artisan-hands.jpg")}
          {renderText("about_pillar_3_eyebrow", "Pillar III Eyebrow", "Empowering Women & Artisans")}
          {renderText("about_pillar_3_bengali", "Pillar III Bengali", "নারী ও কারিগরদের ক্ষমতায়ন")}
          {renderText("about_pillar_3_title", "Pillar III Headline", "Dignity and independence in every stitch.", { colSpan2: true })}
          {renderText(
            "about_pillar_3_body",
            "Pillar III Body",
            "At the heart of Noksha are the Bangladeshi artisans and rural women whose hands hold centuries of skill. Every Nakshi Kantha we release is a singular, one-of-one creation stitched over weeks by women artisans—never mass-duplicated. By championing their craft and valuing unhurried handmade work, we help create sustainable income, creative recognition, and lasting empowerment for women and maker families across Bangladesh.",
            { rows: 3, colSpan2: true }
          )}

          {renderText(
            "about_closing_quote",
            "About Closing Quote",
            "“When you bring a piece of Noksha into your home, you carry a story forward—for the hands that made it, and for the generation that will inherit it.”",
            { rows: 2, colSpan2: true }
          )}
          {renderText("about_closing_bengali", "About Closing Bengali Line", "নকশা — বাংলার ঐতিহ্য, আগামী প্রজন্মের জন্য", { colSpan2: true })}
        </div>
      )}

      {/* 5. DROPS & SHOP PAGES */}
      {section === "drops_shop" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
          {renderImage("drops_hero_image", "Drops Page (/drops) Hero Banner Image", "/images/hero-courtyard.png")}
          {renderText("drops_hero_eyebrow", "Drops Page Eyebrow", "Exclusive Collector Releases · One of One")}
          {renderText("drops_hero_bengali", "Drops Page Bengali Subtitle", "নকশা সম্ভার — একমেবাদ্বিতীয়ম্")}
          {renderText("drops_hero_title", "Drops Page Headline", "The Drops", { colSpan2: true })}
          {renderText(
            "drops_hero_description",
            "Drops Page Description",
            "Each Drop curates singular one-of-one works across Light Shades, Nakshi Kanthas, and Wooden Jewelry Boxes. Once a piece is acquired and delivered, it is permanently inscribed with its collector's name and never repeated.",
            { rows: 3, colSpan2: true }
          )}

          <div className="md:col-span-2 border-t border-[#E6DDD0] pt-4 mt-2">
            <p className="font-bold text-[#7A5417] uppercase text-xs mb-3">Shop All Page (/shop)</p>
          </div>
          {renderText("shop_page_eyebrow", "Shop Page Eyebrow", "Complete Noksha Archive & Store")}
          {renderText("shop_page_title", "Shop Page Headline", "Shop All Pieces")}
          {renderText(
            "shop_page_description",
            "Shop Page Description",
            "Every creation from our atelier in one place—browse multi-stock signature store pieces alongside singular one-of-one collector works from our numbered Drops.",
            { rows: 2, colSpan2: true }
          )}
        </div>
      )}

      {/* 6. BRAND LOGOS, FOOTER & DELIVERY */}
      {section === "brand_footer" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
          {renderImage("brand_logo_dark", "Header Dark Logo (Scrolled / Light Pages)", "/brand/noksha-logo.png")}
          {renderImage("brand_logo_light", "Header & Footer Light Logo (Dark Banners)", "/brand/noksha-logo-light.png")}
          {renderImage("brand_mark", "Brand Emblem / Mark", "/brand/noksha-mark.png")}

          {renderText("footer_tagline_bengali", "Footer Bengali Tagline", "নকশা — বাংলার হাতের কাজ", { colSpan2: true })}
          {renderText("footer_atelier_title", "Footer Column 1 Heading", "Online Atelier")}
          {renderText("footer_care_title", "Footer Column 2 Heading", "Client care")}
          {renderText(
            "footer_atelier_lines",
            "Footer Column 1 Lines (New line for each)",
            "Dhaka, Bangladesh\nDispatched nationwide\nSat – Thu, 11 AM – 7 PM",
            { rows: 3 }
          )}
          <div className="space-y-3">
            {renderText("whatsapp_number", "WhatsApp Client Care Number", "8801973673217", { mono: true })}
            {renderText("support_email", "Support Email", "atelier@noksha.bd")}
            {renderText("footer_delivery_note", "Footer Delivery Line", "Nationwide delivery")}
          </div>

          {renderText("footer_copyright", "Footer Copyright Line", "© 2026 Noksha · Handcrafted in Bangladesh")}
          {renderText("footer_payments_note", "Footer Payments Line", "Cash on delivery · UddoktaPay · bKash · Nagad · Cards")}

          <div className="md:col-span-2 border-t border-[#E6DDD0] pt-4 mt-2">
            <p className="font-bold text-[#7A5417] uppercase text-xs mb-3">Delivery Thresholds (BDT ৳)</p>
          </div>
          {renderText("free_delivery_threshold", "Free Delivery Threshold (BDT)", "8000", { mono: true })}
          {renderText("delivery_dhaka", "Inside Dhaka Delivery Fee (BDT)", "120", { mono: true })}
          {renderText("delivery_outside", "Outside Dhaka Delivery Fee (BDT)", "200", { mono: true })}
        </div>
      )}

      <div className="flex justify-end border-t border-[#E6DDD0] pt-4">
        <button
          type="button"
          onClick={onPublish}
          className="px-6 py-2.5 bg-[#2A1F18] hover:bg-[#4B3527] text-[#FBF8F3] font-bold text-[13px] rounded-lg inline-flex items-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4 text-[#D8BF90]" />
          Publish All Changes
        </button>
      </div>
    </div>
  );
}
