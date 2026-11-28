"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ExternalLink, Plus, Trash2, Upload, X } from "lucide-react";
import { DropStatus } from "@/data/nokshaData";
import { DbCategory, DbCollection } from "@/lib/db";
import { useAdmin } from "../hooks/useAdminData";
import { legacyCardCls, legacyInputCls, legacyThCls } from "./_legacyShared";

const EMPTY_CATEGORY: Partial<DbCategory> = {
  id: "",
  shortName: "",
  name: "",
  bengaliName: "",
  subtitle: "",
  sortOrder: 4,
  active: true,
};

const EMPTY_COLLECTION: Partial<DbCollection> = {
  id: "",
  dropNumber: "Drop 04",
  shortName: "Drop 04",
  title: "",
  bengaliTitle: "",
  subtitle: "",
  description: "",
  story: "",
  craftMetric: "Exclusive 1-of-1 Drop · Handcrafted in Bangladesh",
  priceRange: "৳ 6,500 – ৳ 18,000",
  heroImage: "/images/hero-courtyard.png",
  bannerImage: "/images/hero-courtyard.png",
  accentHex: "#B08A4F",
  exclusivity: "one_of_one",
  dropStatus: "upcoming",
  releaseDate: "Upcoming Drop",
  sortOrder: 4,
  active: true,
};

export default function CollectionsTab() {
  const { data, postAction, notify } = useAdmin();
  const [editingCollection, setEditingCollection] = useState<Partial<DbCollection> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<DbCategory> | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  const handleCollectionImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetField: "heroImage" | "bannerImage"
  ) => {
    const file = e.target.files?.[0];
    if (!file || !editingCollection) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const out = await res.json();
      if (res.ok && out.url) {
        setEditingCollection((prev) => ({
          ...prev,
          [targetField]: out.url,
          ...(targetField === "heroImage" && !prev?.bannerImage ? { bannerImage: out.url } : {}),
        }));
        notify("Collection image uploaded!");
      } else {
        notify(out.error || "Upload failed", { variant: "error" });
      }
    } catch {
      notify("Upload error", { variant: "error" });
    } finally {
      setUploadingImg(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-a-text-1">
              Exclusive Collections &amp; Numbered Drops (1-of-1 Pieces)
            </h2>
            <p className="text-[13px] text-a-text-2 mt-0.5">
              Every Collection is an exclusive Drop (<span className="font-num">Drop 01, Drop 02, Drop 03</span>) where all pieces are strictly <span className="font-num">1 of 1</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setEditingCollection({
                ...EMPTY_COLLECTION,
                dropNumber: `Drop 0${data.collections.length + 1}`,
                shortName: `Drop 0${data.collections.length + 1}`,
                sortOrder: data.collections.length + 1,
              })
            }
            className="admin-press px-4 py-2 rounded-lg bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink text-[13px] font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-a-accent" />
            Create New Exclusive Drop
          </button>
        </div>

        {editingCollection && (
          <div className="bg-a-surface admin-surface-enter border border-a-border-strong rounded-xl p-6 space-y-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-a-border pb-3">
              <h3 className="text-base font-semibold text-a-text-1">
                {editingCollection.id
                  ? `Edit Exclusive Drop: ${editingCollection.dropNumber || editingCollection.shortName} — ${editingCollection.title}`
                  : "Create New Exclusive Drop Collection"}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCollection(null)}
                aria-label="Close editor"
                className="p-1 text-a-text-2 hover:text-a-text-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
              <div>
                <label className="block mb-1">Drop Number *</label>
                <input
                  type="text"
                  value={editingCollection.dropNumber || editingCollection.shortName || ""}
                  onChange={(e) =>
                    setEditingCollection({
                      ...editingCollection,
                      dropNumber: e.target.value,
                      shortName: e.target.value,
                    })
                  }
                  placeholder="e.g. Drop 04"
                  className={`${legacyInputCls} font-num`}
                />
              </div>
              <div>
                <label className="block mb-1">Collection / Drop Title *</label>
                <input
                  type="text"
                  value={editingCollection.title || ""}
                  onChange={(e) =>
                    setEditingCollection({ ...editingCollection, title: e.target.value })
                  }
                  className={legacyInputCls}
                />
              </div>
              <div>
                <label className="block mb-1">Bengali Title (বাংলা নাম) *</label>
                <input
                  type="text"
                  value={editingCollection.bengaliTitle || ""}
                  onChange={(e) =>
                    setEditingCollection({ ...editingCollection, bengaliTitle: e.target.value })
                  }
                  className={legacyInputCls}
                />
              </div>
              <div>
                <label className="block mb-1">Drop Release Stage *</label>
                <select
                  value={editingCollection.dropStatus || "live"}
                  onChange={(e) =>
                    setEditingCollection({
                      ...editingCollection,
                      dropStatus: e.target.value as DropStatus,
                    })
                  }
                  className={legacyInputCls}
                >
                  <option value="upcoming">Upcoming Preview (Not Yet Open)</option>
                  <option value="prebooking">Open for Pre-Booking (Reservation Only)</option>
                  <option value="live">Live Drop (Open to Acquire Immediately)</option>
                  <option value="archived">Archived Drop (Completed Release)</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Release Date / Timing Label</label>
                <input
                  type="text"
                  value={editingCollection.releaseDate || ""}
                  onChange={(e) =>
                    setEditingCollection({ ...editingCollection, releaseDate: e.target.value })
                  }
                  className={`${legacyInputCls} font-num`}
                />
              </div>
              <div>
                <label className="block mb-1">Poetic Subtitle</label>
                <input
                  type="text"
                  value={editingCollection.subtitle || ""}
                  onChange={(e) =>
                    setEditingCollection({ ...editingCollection, subtitle: e.target.value })
                  }
                  className={legacyInputCls}
                />
              </div>
              <div>
                <label className="block mb-1">Making Time Metric</label>
                <input
                  type="text"
                  value={editingCollection.craftMetric || ""}
                  onChange={(e) =>
                    setEditingCollection({ ...editingCollection, craftMetric: e.target.value })
                  }
                  className={legacyInputCls}
                />
              </div>
              <div>
                <label className="block mb-1">Price Range (BDT ৳)</label>
                <input
                  type="text"
                  value={editingCollection.priceRange || ""}
                  onChange={(e) =>
                    setEditingCollection({ ...editingCollection, priceRange: e.target.value })
                  }
                  className={`${legacyInputCls} font-num`}
                />
              </div>
              <div>
                <label className="block mb-1">Sort Order</label>
                <input
                  type="number"
                  value={editingCollection.sortOrder ?? 1}
                  onChange={(e) =>
                    setEditingCollection({
                      ...editingCollection,
                      sortOrder: Number(e.target.value),
                    })
                  }
                  className={`${legacyInputCls} font-num`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-a-subtle p-4 rounded-xl border border-a-border text-[13px]">
              <div className="flex items-start gap-3">
                <img
                  src={editingCollection.heroImage || "/images/hero-courtyard.png"}
                  alt="Card Preview"
                  className="w-20 h-24 object-cover rounded border border-a-border shrink-0"
                />
                <div className="flex-1 space-y-2">
                  <label className="block">Drop Card Image (4:5 Portrait)</label>
                  <input
                    type="text"
                    value={editingCollection.heroImage || ""}
                    onChange={(e) =>
                      setEditingCollection({ ...editingCollection, heroImage: e.target.value })
                    }
                    className={legacyInputCls}
                  />
                  <label className="admin-press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink cursor-pointer text-[12px] font-medium">
                    <Upload className="w-3.5 h-3.5 text-a-accent" />
                    {uploadingImg ? "Uploading…" : "Upload Card Image"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCollectionImageUpload(e, "heroImage")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <img
                  src={
                    editingCollection.bannerImage ||
                    editingCollection.heroImage ||
                    "/images/hero-courtyard.png"
                  }
                  alt="Banner Preview"
                  className="w-28 h-20 object-cover rounded border border-a-border shrink-0"
                />
                <div className="flex-1 space-y-2">
                  <label className="block">Full-Bleed Drop Banner Image</label>
                  <input
                    type="text"
                    value={editingCollection.bannerImage || ""}
                    onChange={(e) =>
                      setEditingCollection({ ...editingCollection, bannerImage: e.target.value })
                    }
                    className={legacyInputCls}
                  />
                  <label className="admin-press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink cursor-pointer text-[12px] font-medium">
                    <Upload className="w-3.5 h-3.5 text-a-accent" />
                    {uploadingImg ? "Uploading…" : "Upload Banner Image"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCollectionImageUpload(e, "bannerImage")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-[13px]">
              <div>
                <label className="block mb-1">Homepage Summary Description</label>
                <textarea
                  rows={2}
                  value={editingCollection.description || ""}
                  onChange={(e) =>
                    setEditingCollection({ ...editingCollection, description: e.target.value })
                  }
                  className={legacyInputCls}
                />
              </div>
              <div>
                <label className="block mb-1">Dedicated Drop Page Story</label>
                <textarea
                  rows={4}
                  value={editingCollection.story || ""}
                  onChange={(e) =>
                    setEditingCollection({ ...editingCollection, story: e.target.value })
                  }
                  className={legacyInputCls}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                <input
                  type="checkbox"
                  checked={editingCollection.active !== false}
                  onChange={(e) =>
                    setEditingCollection({ ...editingCollection, active: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="font-medium text-a-text-1">Visible on Storefront</span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCollection(null)}
                  className="admin-press px-4 py-2 rounded-lg bg-a-subtle text-a-text-1 border border-a-border text-[13px] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await postAction(
                      { action: "save_collection", collection: editingCollection },
                      `Saved drop "${editingCollection.dropNumber} — ${editingCollection.title}"`
                    );
                    if (ok) setEditingCollection(null);
                  }}
                  className="admin-press px-5 py-2 rounded-lg bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink text-[13px] font-medium cursor-pointer"
                >
                  Save Drop Collection
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={`${legacyCardCls} overflow-hidden`}>
          <table className="w-full text-[13px] text-left border-collapse">
            <thead>
              <tr>
                <th className={legacyThCls}>Drop</th>
                <th className={legacyThCls}>Collection Title &amp; Page</th>
                <th className={legacyThCls}>1-of-1 Pieces</th>
                <th className={legacyThCls}>Live Drop Control</th>
                <th className={legacyThCls}>Release Timing</th>
                <th className={`${legacyThCls} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-a-border">
              {data.collections.map((col) => {
                const pieceCount = data.products.filter((p) => p.collectionId === col.id).length;
                return (
                  <tr key={col.id} className="admin-row-hover">
                    <td className="py-3.5 px-4 font-num font-semibold text-a-text-1">
                      <span className="px-2.5 py-1 rounded bg-a-ink-btn text-a-on-ink text-[12px]">
                        {col.dropNumber || col.shortName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <img
                        src={col.heroImage}
                        alt={col.title}
                        className="w-12 h-14 rounded object-cover shrink-0 border border-a-border"
                      />
                      <div>
                        <p className="font-medium text-a-text-1">{col.title}</p>
                        <p className="text-a-text-2">{col.bengaliTitle}</p>
                        <p className="font-mono text-[12px] text-a-text-3">/collections/{col.id}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-num font-medium text-a-text-1">
                      {pieceCount} {pieceCount === 1 ? "piece (1 of 1)" : "pieces (1 of 1)"}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={col.dropStatus || "live"}
                        onChange={(e) =>
                          postAction(
                            {
                              action: "save_collection",
                              collection: {
                                ...col,
                                dropStatus: e.target.value as DropStatus,
                              },
                            },
                            `Updated ${col.dropNumber} status to ${e.target.value}`
                          )
                        }
                        className="px-3 py-1.5 bg-a-surface border border-a-border-strong rounded-lg text-[13px] font-medium text-a-text-1 cursor-pointer"
                      >
                        <option value="upcoming">Upcoming Preview</option>
                        <option value="prebooking">Open for Pre-Booking</option>
                        <option value="live">Live Drop (Open to Acquire)</option>
                        <option value="archived">Archived Drop</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 font-num text-a-text-2">
                      {col.releaseDate || "Live Now"}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        href={`/collections/${col.id}`}
                        target="_blank"
                        className="admin-press px-3 py-1.5 rounded-lg bg-a-subtle hover:bg-a-subtle-hover text-a-text-1 border border-a-border font-medium inline-flex items-center gap-1"
                      >
                        Drop Page <ExternalLink className="w-3 h-3" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setEditingCollection(col)}
                        className="admin-press px-3 py-1.5 rounded-lg bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink font-medium cursor-pointer"
                      >
                        Edit Drop
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          postAction(
                            { action: "delete_collection", id: col.id },
                            `Deleted collection ${col.title}`
                          )
                        }
                        aria-label={`Delete ${col.title}`}
                        className="admin-press p-1.5 rounded-lg bg-a-danger-bg text-a-danger cursor-pointer inline-flex items-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-5 border-t border-a-border pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-a-text-1">
              Store Product Categories
            </h2>
            <p className="text-[13px] text-a-text-2 mt-0.5">
              Manage product categories like <strong>Light Shades</strong>, <strong>Nakshi Kanthas</strong>, and <strong>Wooden Jewelry Boxes</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setEditingCategory({
                ...EMPTY_CATEGORY,
                sortOrder: (data.categories?.length ?? 3) + 1,
              })
            }
            className="admin-press px-4 py-2 rounded-lg bg-a-subtle hover:bg-a-subtle-hover text-a-text-1 border border-a-border text-[13px] font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-a-accent" />
            Add New Category
          </button>
        </div>

        {editingCategory && (
          <div className="bg-a-surface admin-surface-enter border border-a-border-strong rounded-xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-a-border pb-3">
              <h3 className="text-base font-semibold text-a-text-1">
                {editingCategory.id
                  ? `Edit Category: ${editingCategory.name}`
                  : "Create New Store Category"}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                aria-label="Close category editor"
                className="p-1 text-a-text-2 hover:text-a-text-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[13px]">
              <div>
                <label className="block mb-1">Category Name *</label>
                <input
                  type="text"
                  value={editingCategory.name || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className={legacyInputCls}
                />
              </div>
              <div>
                <label className="block mb-1">Short Heritage Label</label>
                <input
                  type="text"
                  value={editingCategory.shortName || ""}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, shortName: e.target.value })
                  }
                  className={legacyInputCls}
                />
              </div>
              <div>
                <label className="block mb-1">Bengali Name (বাংলা নাম)</label>
                <input
                  type="text"
                  value={editingCategory.bengaliName || ""}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, bengaliName: e.target.value })
                  }
                  className={legacyInputCls}
                />
              </div>
              <div>
                <label className="block mb-1">Sort Order</label>
                <input
                  type="number"
                  value={editingCategory.sortOrder ?? 1}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      sortOrder: Number(e.target.value),
                    })
                  }
                  className={`${legacyInputCls} font-num`}
                />
              </div>
              <div className="md:col-span-4">
                <label className="block mb-1">Category Subtitle</label>
                <input
                  type="text"
                  value={editingCategory.subtitle || ""}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, subtitle: e.target.value })
                  }
                  className={legacyInputCls}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="admin-press px-4 py-2 rounded-lg bg-a-subtle text-a-text-1 border border-a-border text-[13px] font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await postAction(
                    { action: "save_category", category: editingCategory },
                    `Saved category "${editingCategory.name}"`
                  );
                  if (ok) setEditingCategory(null);
                }}
                className="admin-press px-5 py-2 rounded-lg bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink text-[13px] font-medium cursor-pointer"
              >
                Save Category
              </button>
            </div>
          </div>
        )}

        <div className={`${legacyCardCls} overflow-hidden`}>
          <table className="w-full text-[13px] text-left border-collapse">
            <thead>
              <tr>
                <th className={legacyThCls}>Order</th>
                <th className={legacyThCls}>Category Name</th>
                <th className={legacyThCls}>Bengali Name &amp; Subtitle</th>
                <th className={legacyThCls}>Regular Store Pieces</th>
                <th className={legacyThCls}>1-of-1 Drop Pieces</th>
                <th className={`${legacyThCls} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-a-border">
              {(data.categories || []).map((cat) => {
                const catProducts = data.products.filter((p) => p.category === cat.id);
                const storeCount = catProducts.filter((p) => !p.collectionId).length;
                const dropCount = catProducts.filter((p) => Boolean(p.collectionId)).length;
                return (
                  <tr key={cat.id} className="admin-row-hover">
                    <td className="py-3.5 px-4 font-num font-medium text-a-text-1">
                      #{cat.sortOrder}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-a-text-1">
                        {cat.name} <span className="text-a-text-3">({cat.shortName})</span>
                      </p>
                      <p className="font-mono text-[12px] text-a-text-3">id: {cat.id}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-a-text-1">{cat.bengaliName}</p>
                      <p className="text-a-text-2 line-clamp-1">{cat.subtitle}</p>
                    </td>
                    <td className="py-3.5 px-4 font-num font-medium text-a-success">
                      {storeCount} multi-stock {storeCount === 1 ? "piece" : "pieces"}
                    </td>
                    <td className="py-3.5 px-4 font-num font-medium text-a-accent-text">
                      {dropCount} exclusive drop {dropCount === 1 ? "piece" : "pieces"}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingCategory(cat)}
                        className="admin-press px-3 py-1.5 rounded-lg bg-a-subtle hover:bg-a-subtle-hover text-a-text-1 border border-a-border font-medium cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          postAction(
                            { action: "delete_category", id: cat.id },
                            `Deleted category ${cat.name}`
                          )
                        }
                        aria-label={`Delete ${cat.name}`}
                        className="admin-press p-1.5 rounded-lg bg-a-danger-bg text-a-danger cursor-pointer inline-flex items-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
