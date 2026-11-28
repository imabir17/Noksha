"use client";

import React, { useMemo, useState } from "react";
import { Eye, Image as ImageIcon, RotateCcw, Save, Upload } from "lucide-react";
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  SegmentedControl,
  Textarea,
} from "./ui";

type ContentSection =
  | "hero"
  | "manifesto"
  | "atelier"
  | "about"
  | "drops_shop"
  | "brand_footer";

interface SiteContentEditorProps {
  contentDraft: Record<string, string>;
  savedContent: Record<string, string>;
  setContentDraft: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onPublish: () => Promise<boolean | void>;
  onDiscard: () => void;
  notify: (msg: string) => void;
}

const SECTION_TABS: { id: ContentSection; label: string }[] = [
  { id: "hero", label: "Hero & Banner" },
  { id: "manifesto", label: "Manifesto & Store" },
  { id: "atelier", label: "Atelier & Circle" },
  { id: "about", label: "About Page" },
  { id: "drops_shop", label: "Drops & Shop" },
  { id: "brand_footer", label: "Brand & Delivery" },
];

export default function SiteContentEditor({
  contentDraft,
  savedContent,
  setContentDraft,
  onPublish,
  onDiscard,
  notify,
}: SiteContentEditorProps) {
  const [section, setSection] = useState<ContentSection>("hero");
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const isDirty = useMemo(
    () => JSON.stringify(contentDraft) !== JSON.stringify(savedContent),
    [contentDraft, savedContent]
  );

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
        notify("Image uploaded and attached");
      } else {
        notify(out.error || "Upload failed");
      }
    } catch {
      notify("Upload error");
    } finally {
      setUploadingKey(null);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    await onPublish();
    setPublishing(false);
  };

  const renderText = (
    key: string,
    label: string,
    fallback: string,
    opts?: { rows?: number; colSpan2?: boolean; mono?: boolean; placeholder?: string }
  ) => (
    <Field
      label={label}
      className={opts?.colSpan2 ? "md:col-span-2" : ""}
      action={
        contentDraft[key] !== undefined && contentDraft[key] !== fallback ? (
          <button
            type="button"
            onClick={() => setKey(key, fallback)}
            className="text-[12px] font-medium text-a-accent-text hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Default
          </button>
        ) : undefined
      }
    >
      {opts?.rows ? (
        <Textarea
          rows={opts.rows}
          value={val(key, fallback)}
          onChange={(e) => setKey(key, e.target.value)}
          placeholder={opts?.placeholder || fallback}
        />
      ) : (
        <Input
          numeral={opts?.mono}
          value={val(key, fallback)}
          onChange={(e) => setKey(key, e.target.value)}
          placeholder={opts?.placeholder || fallback}
        />
      )}
    </Field>
  );

  const renderImage = (key: string, label: string, fallback: string) => {
    const src = val(key, fallback);
    return (
      <div className="md:col-span-2 flex flex-col sm:flex-row items-start gap-4 p-4 rounded-[10px] bg-a-subtle border border-a-border">
        <img
          src={src || fallback}
          alt={label}
          className="w-24 h-20 object-cover rounded-[8px] border border-a-border bg-a-surface shrink-0"
        />
        <div className="flex-1 w-full space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-medium text-a-text-2 inline-flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-a-accent" />
              {label}
            </span>
            {src !== fallback && (
              <button
                type="button"
                onClick={() => setKey(key, fallback)}
                className="text-[12px] font-medium text-a-accent-text hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
          <Input
            value={src}
            onChange={(e) => setKey(key, e.target.value)}
            placeholder={fallback}
          />
          <label className="admin-press inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-a-surface hover:bg-a-subtle border border-a-border-strong text-a-text-1 text-[12px] font-medium cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-a-accent" />
            {uploadingKey === key ? "Uploading…" : "Upload image"}
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
    <div className="space-y-6">
      <PageHeader
        title="Site Content CMS"
        description="Edit storefront headlines, Bengali taglines, heritage stories, brand logos, and nationwide delivery rates."
        actions={
          <Button
            variant="primary"
            loading={publishing}
            leftIcon={<Save className="w-4 h-4 text-a-accent" />}
            onClick={handlePublish}
          >
            Publish changes
          </Button>
        }
        toolbar={
          <SegmentedControl
            value={section}
            onChange={setSection}
            options={SECTION_TABS}
          />
        }
      />

      {/* Sticky Unsaved Changes Bar */}
      {isDirty && (
        <div className="admin-surface-enter sticky top-16 z-20 px-4 py-2.5 rounded-[10px] bg-a-ink-btn text-a-on-ink shadow-[var(--a-shadow-pop)] flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] font-medium flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-a-accent" />
            Unsaved content edits
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDiscard}
              className="admin-press px-3 py-1.5 rounded-[6px] bg-a-surface/15 hover:bg-a-surface/25 text-[12px] font-medium cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={publishing}
              onClick={handlePublish}
              className="admin-press px-3.5 py-1.5 rounded-[6px] bg-a-accent text-a-ink-btn text-[12px] font-semibold cursor-pointer"
            >
              {publishing ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>
      )}

      {/* Two-Column Layout: Form Left + Live Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Card className="lg:col-span-7">
          <div key={section} className="admin-surface-enter">
            {section === "hero" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex items-center gap-3 p-3.5 rounded-[8px] bg-a-subtle border border-a-border">
                  <input
                    type="checkbox"
                    checked={contentDraft.announcement_enabled === "true"}
                    onChange={(e) =>
                      setKey("announcement_enabled", e.target.checked ? "true" : "false")
                    }
                    className="w-4 h-4 accent-[var(--a-ink-btn)]"
                  />
                  <span className="text-[13px] font-medium text-a-text-1">
                    Show top announcement banner on storefront
                  </span>
                </div>
                {renderText(
                  "announcement_text",
                  "Top announcement text",
                  "Founding Batch No. 01 · Complimentary delivery over ৳ 8,000",
                  { colSpan2: true, mono: true }
                )}
                {renderImage("hero_image", "Homepage Hero Image", "/images/hero-courtyard.png")}
                {renderText("hero_eyebrow", "Hero Eyebrow", "The Inaugural Collection")}
                {renderText("hero_bengali", "Hero Bengali Tagline", "আলো, সুতো ও কাঠের কাব্য")}
                {renderText("hero_title_line1", "Hero Headline Line 1", "Heirlooms for the")}
                {renderText("hero_title_line2", "Hero Headline Line 2 (Italic)", "Bengali home.")}
                {renderText("hero_cta_primary", "Primary Button Label", "Discover the pieces")}
                {renderText("hero_cta_secondary", "Secondary Link Label", "Our story")}
                {renderText("hero_index_1", "Corner Index I", "I.  Alo — Light")}
                {renderText("hero_index_2", "Corner Index II", "II.  Kantha — Thread")}
                {renderText("hero_index_3", "Corner Index III", "III.  Boxes — Timber")}
              </div>
            )}

            {section === "manifesto" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderText(
                  "manifesto_eyebrow",
                  "Manifesto Eyebrow",
                  "নকশা — meaning “design, pattern”",
                  { colSpan2: true }
                )}
                {renderText(
                  "manifesto_body",
                  "Manifesto Main Statement",
                  "We began with three objects every Bengali home has always held dear — a lamp for the evening, a kantha for rest, and a carved box for what we cannot bear to lose. Each is made slowly, by hand, by Bangladeshi Artisans.",
                  { rows: 3, colSpan2: true }
                )}
                {renderText("manifesto_stat_1_num", "Stat 1 Number", "3", { mono: true })}
                {renderText("manifesto_stat_1_label", "Stat 1 Label", "Craft categories")}
                {renderText("manifesto_stat_2_num", "Stat 2 Number", "280", { mono: true })}
                {renderText("manifesto_stat_2_label", "Stat 2 Label", "Hours in one kantha")}
                {renderText("manifesto_stat_3_num", "Stat 3 Number", "100%", { mono: true })}
                {renderText("manifesto_stat_3_label", "Stat 3 Label", "Made in Bangladesh")}
                {renderText("categories_eyebrow", "Categories Eyebrow", "The Categories")}
                {renderText("categories_title", "Categories Heading", "Three crafts, one house.")}
                {renderText(
                  "categories_subtitle",
                  "Categories Description",
                  "Explore our signature craft categories—available as multi-piece store editions or as one-of-one collector pieces in our numbered Drops.",
                  { rows: 2, colSpan2: true }
                )}
                {renderText("shop_eyebrow", "Store Eyebrow", "Curated Store Categories")}
                {renderText("shop_title", "Store Heading", "The pieces")}
                {renderText(
                  "shop_subtitle",
                  "Store Subtitle",
                  "Browse our signature store categories with multi-piece availability.",
                  { rows: 2, colSpan2: true }
                )}
              </div>
            )}

            {section === "atelier" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderImage("atelier_image", "Atelier Craft Image", "/images/artisan-hands.jpg")}
                {renderText("atelier_eyebrow", "Atelier Eyebrow", "The Atelier")}
                {renderText("atelier_caption", "Image Caption", "Hand-stitched in Bangladesh")}
                {renderText(
                  "atelier_quote",
                  "Pull Quote",
                  "“Pull the thread too tight and the story loses its softness.”",
                  { rows: 2, colSpan2: true }
                )}
                {renderText("tenet_1_title", "Tenet 01 Title", "A singular story")}
                {renderText(
                  "tenet_1_body",
                  "Tenet 01 Body",
                  "Every Nakshi Kantha is one of a kind — one design, stitched once, never repeated.",
                  { rows: 2 }
                )}
                {renderText("tenet_2_title", "Tenet 02 Title", "Honest materials")}
                {renderText(
                  "tenet_2_body",
                  "Tenet 02 Body",
                  "Handloom kora cotton, seasoned bamboo, alluvial terracotta, and solid Bengal hardwood.",
                  { rows: 2 }
                )}
                {renderText("tenet_3_title", "Tenet 03 Title", "Wrapped to keep")}
                {renderText(
                  "tenet_3_body",
                  "Tenet 03 Body",
                  "Each piece leaves our Dhaka studio wrapped in unbleached kora muslin.",
                  { rows: 2 }
                )}
                {renderText("circle_eyebrow", "Founding Circle Eyebrow", "The Founding Circle")}
                {renderText("circle_title_line1", "Circle Headline 1", "An invitation to")}
                {renderText("circle_title_line2", "Circle Headline 2", "our first collectors.")}
                {renderText(
                  "circle_body",
                  "Founding Circle Body",
                  "Private previews of each batch before release, early access to one-of-one Kanthas, and a founding courtesy.",
                  { rows: 2, colSpan2: true }
                )}
              </div>
            )}

            {section === "about" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderImage("about_hero_image", "About Hero Banner", "/images/about-shital-pati.jpg")}
                {renderText("about_hero_eyebrow", "About Eyebrow", "About Noksha · আমাদের গল্প")}
                {renderText("about_hero_bengali", "About Bengali Tagline", "বাংলার ইতিহাস, নতুন প্রজন্মের গর্ব ও নারীর হাতের সম্মান")}
                {renderText("about_hero_title_1", "About Headline 1", "Preserving our history.")}
                {renderText("about_hero_title_2", "About Headline 2", "Empowering the hands that make it.")}
                {renderText("about_why_title", "Why We Started Heading", "Because a culture lives in what it chooses to keep.", { colSpan2: true })}
                {renderText(
                  "about_why_p1",
                  "Why We Started — Paragraph 1",
                  "Noksha (নকশা) began with a deeply personal question: as our homes become more modern, why must our own history and craftsmanship disappear from them?",
                  { rows: 2, colSpan2: true }
                )}
                {renderText(
                  "about_mission_title",
                  "Mission Headline",
                  "To preserve Bangladeshi heritage, pass it to the next generation, and uplift the women and artisans behind every piece.",
                  { rows: 2, colSpan2: true }
                )}
                {renderText(
                  "about_vision_title",
                  "Vision Headline",
                  "A world where Bangladeshi craft is celebrated as timeless luxury—and every maker thrives with pride.",
                  { rows: 2, colSpan2: true }
                )}
                {renderImage("about_pillar_1_image", "Purpose Pillar I Image", "/images/kantha-crimson-padma.png")}
                {renderImage("about_pillar_2_image", "Purpose Pillar II Image", "/images/light-jamdani-pendant.png")}
                {renderImage("about_pillar_3_image", "Purpose Pillar III Image", "/images/artisan-hands.jpg")}
              </div>
            )}

            {section === "drops_shop" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderImage("drops_hero_image", "Drops Page Hero Image", "/images/hero-courtyard.png")}
                {renderText("drops_hero_eyebrow", "Drops Eyebrow", "Exclusive Collector Releases · One of One")}
                {renderText("drops_hero_bengali", "Drops Bengali Subtitle", "নকশা সম্ভার — একমেবাদ্বিতীয়ম্")}
                {renderText("drops_hero_title", "Drops Headline", "The Drops", { colSpan2: true })}
                {renderText(
                  "drops_hero_description",
                  "Drops Description",
                  "Each Drop curates singular one-of-one works across Light Shades, Nakshi Kanthas, and Wooden Jewelry Boxes.",
                  { rows: 3, colSpan2: true }
                )}
                {renderText("shop_page_eyebrow", "Shop Page Eyebrow", "Complete Noksha Archive & Store")}
                {renderText("shop_page_title", "Shop Page Headline", "Shop All Pieces")}
                {renderText(
                  "shop_page_description",
                  "Shop Page Description",
                  "Every creation from our atelier in one place—browse multi-stock signature store pieces alongside singular one-of-one collector works.",
                  { rows: 2, colSpan2: true }
                )}
              </div>
            )}

            {section === "brand_footer" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderImage("brand_logo_dark", "Dark Brand Logo", "/brand/noksha-logo.png")}
                {renderImage("brand_logo_light", "Light Brand Logo", "/brand/noksha-logo-light.png")}
                {renderImage("brand_mark", "Brand Mark", "/brand/noksha-mark.png")}
                {renderText("footer_tagline_bengali", "Footer Bengali Tagline", "নকশা — বাংলার হাতের কাজ", { colSpan2: true })}
                {renderText("whatsapp_number", "WhatsApp Client Care Number", "8801973673217", { mono: true })}
                {renderText("support_email", "Support Email", "atelier@noksha.bd")}
                {renderText("footer_copyright", "Copyright Line", "© 2026 Noksha · Handcrafted in Bangladesh", { colSpan2: true })}
                {renderText("free_delivery_threshold", "Free Delivery Threshold (BDT)", "8000", { mono: true })}
                {renderText("delivery_dhaka", "Inside Dhaka Fee (BDT)", "120", { mono: true })}
                {renderText("delivery_outside", "Outside Dhaka Fee (BDT)", "200", { mono: true })}
              </div>
            )}
          </div>
        </Card>

        {/* Sticky Live Preview Column */}
        <div className="lg:col-span-5 lg:sticky lg:top-20">
          <Card
            title="Live section preview"
            description="Instant preview of your typography and imagery."
            actions={<Eye className="w-4 h-4 text-a-accent" />}
          >
            {section === "hero" && (
              <div className="space-y-3">
                {contentDraft.announcement_enabled === "true" && (
                  <div className="py-1.5 px-3 rounded-[6px] bg-a-ink-btn text-a-on-ink text-[12px] text-center font-num">
                    {val("announcement_text", "Founding Batch No. 01 · Complimentary delivery over ৳ 8,000")}
                  </div>
                )}
                <div className="relative rounded-[10px] overflow-hidden aspect-[16/10] bg-a-ink-btn">
                  <img
                    src={val("hero_image", "/images/hero-courtyard.png")}
                    alt="Hero preview"
                    className="w-full h-full object-cover opacity-75"
                  />
                  <div className="absolute inset-0 p-5 flex flex-col justify-end bg-a-overlay text-a-on-ink">
                    <p className="text-[12px] uppercase tracking-[0.18em] opacity-85">
                      {val("hero_eyebrow", "The Inaugural Collection")}
                    </p>
                    <p className="font-display text-2xl leading-tight mt-1">
                      {val("hero_title_line1", "Heirlooms for the")}{" "}
                      <em>{val("hero_title_line2", "Bengali home.")}</em>
                    </p>
                    <p className="font-bengali text-[13px] opacity-90 mt-1">
                      {val("hero_bengali", "আলো, সুতো ও কাঠের কাব্য")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {section === "manifesto" && (
              <div className="p-5 rounded-[10px] bg-a-subtle border border-a-border space-y-4">
                <p className="text-[12px] uppercase tracking-[0.12em] text-a-accent-text">
                  {val("manifesto_eyebrow", "নকশা — meaning “design, pattern”")}
                </p>
                <p className="font-display text-xl leading-snug text-a-text-1">
                  {val(
                    "manifesto_body",
                    "We began with three objects every Bengali home has always held dear…"
                  )}
                </p>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-a-border text-center">
                  <div>
                    <p className="font-num text-lg font-semibold text-a-text-1">
                      {val("manifesto_stat_1_num", "3")}
                    </p>
                    <p className="text-[12px] text-a-text-3">
                      {val("manifesto_stat_1_label", "Craft categories")}
                    </p>
                  </div>
                  <div>
                    <p className="font-num text-lg font-semibold text-a-text-1">
                      {val("manifesto_stat_2_num", "280")}
                    </p>
                    <p className="text-[12px] text-a-text-3">
                      {val("manifesto_stat_2_label", "Hours")}
                    </p>
                  </div>
                  <div>
                    <p className="font-num text-lg font-semibold text-a-text-1">
                      {val("manifesto_stat_3_num", "100%")}
                    </p>
                    <p className="text-[12px] text-a-text-3">
                      {val("manifesto_stat_3_label", "Bangladesh")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {section === "atelier" && (
              <div className="space-y-3">
                <img
                  src={val("atelier_image", "/images/artisan-hands.jpg")}
                  alt="Atelier preview"
                  className="w-full h-40 object-cover rounded-[10px] border border-a-border"
                />
                <p className="font-display text-xl italic text-a-text-1">
                  {val("atelier_quote", "“Pull the thread too tight and the story loses its softness.”")}
                </p>
              </div>
            )}

            {section === "about" && (
              <div className="space-y-3">
                <img
                  src={val("about_hero_image", "/images/about-shital-pati.jpg")}
                  alt="About preview"
                  className="w-full h-36 object-cover rounded-[10px] border border-a-border"
                />
                <p className="font-display text-xl text-a-text-1">
                  {val("about_hero_title_1", "Preserving our history.")}{" "}
                  <em>{val("about_hero_title_2", "Empowering the hands that make it.")}</em>
                </p>
                <p className="text-[13px] text-a-text-2">
                  {val("about_why_p1", "Noksha began with a deeply personal question…")}
                </p>
              </div>
            )}

            {section === "drops_shop" && (
              <div className="space-y-3">
                <img
                  src={val("drops_hero_image", "/images/hero-courtyard.png")}
                  alt="Drops preview"
                  className="w-full h-36 object-cover rounded-[10px] border border-a-border"
                />
                <p className="text-[12px] uppercase tracking-[0.12em] text-a-accent-text">
                  {val("drops_hero_eyebrow", "Exclusive Collector Releases · One of One")}
                </p>
                <p className="font-display text-2xl text-a-text-1">
                  {val("drops_hero_title", "The Drops")}
                </p>
                <p className="text-[13px] text-a-text-2">
                  {val("drops_hero_description", "Each Drop curates singular one-of-one works…")}
                </p>
              </div>
            )}

            {section === "brand_footer" && (
              <div className="p-4 rounded-[10px] bg-a-subtle border border-a-border space-y-3 text-[13px]">
                <img
                  src={val("brand_logo_dark", "/brand/noksha-logo.png")}
                  alt="Logo preview"
                  className="h-8 w-auto object-contain"
                />
                <p className="font-bengali text-a-text-1">
                  {val("footer_tagline_bengali", "নকশা — বাংলার হাতের কাজ")}
                </p>
                <div className="pt-2 border-t border-a-border font-num text-[12px] text-a-text-2 space-y-1">
                  <p>WhatsApp: +{val("whatsapp_number", "8801973673217")}</p>
                  <p>
                    Delivery: ৳{val("delivery_dhaka", "120")} Dhaka · ৳
                    {val("delivery_outside", "200")} Nationwide (Free ≥ ৳
                    {val("free_delivery_threshold", "8000")})
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
