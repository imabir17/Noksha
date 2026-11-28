"use client";

import React, { useState } from "react";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { formatBDT, PillarId, ProductStatus } from "@/data/nokshaData";
import { DbProduct } from "@/lib/db";
import { useAdmin } from "../hooks/useAdminData";
import { LegacyStatusBadge, legacyCardCls, legacyInputCls, legacyThCls } from "./_legacyShared";

const EMPTY_PRODUCT: Partial<DbProduct> = {
  id: "",
  sku: "",
  name: "",
  bengaliName: "",
  category: "light-shades",
  collectionId: "",
  acquiredBy: "",
  priceBDT: 5500,
  originalPriceBDT: undefined,
  costBDT: 2600,
  stockQty: 8,
  lowStockThreshold: 2,
  status: "ready",
  statusLabel: "In Stock",
  region: "Bangladesh",
  artisanHours: 42,
  artisanHoursLabel: "42 Hours Handcrafted",
  materials: "",
  dimensions: "",
  story: "",
  care: "",
  image: "/images/light-jamdani-pendant.png",
  gallery: ["/images/light-jamdani-pendant.png"],
  accentColor: "#B08A4F",
  colors: [{ name: "Signature", hex: "#B08A4F" }],
};

export default function ProductsTab() {
  const { data, postAction, notify } = useAdmin();
  const [editingProduct, setEditingProduct] = useState<Partial<DbProduct> | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const out = await res.json();
      if (res.ok && out.url) {
        setEditingProduct((prev) => ({
          ...prev,
          image: out.url,
          gallery: [out.url, ...(prev?.gallery ?? []).filter((g) => g !== out.url)],
        }));
        notify("Image uploaded and attached to piece");
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-[14px] text-a-text-2">
          Add <strong>Regular Store Products</strong> (multi-stock items under a Category) or <strong>Exclusive Collection Drop Pieces</strong> (<span className="font-num">1 of 1</span> items).
        </p>
        <button
          type="button"
          onClick={() => setEditingProduct({ ...EMPTY_PRODUCT })}
          className="admin-press px-4 py-2 rounded-lg bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink text-[13px] font-medium flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-a-accent" />
          Add New Product
        </button>
      </div>

      {editingProduct && (
        <div className="bg-a-surface admin-surface-enter border border-a-border-strong rounded-xl p-6 space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-a-border pb-3">
            <h2 className="text-base font-semibold text-a-text-1">
              {editingProduct.id ? `Edit Product: ${editingProduct.name}` : "Add New Product"}
            </h2>
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              aria-label="Close product editor"
              className="p-1 text-a-text-2 hover:text-a-text-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
            <div>
              <label className="block mb-1">English Title *</label>
              <input
                type="text"
                value={editingProduct.name || ""}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                className={legacyInputCls}
              />
            </div>
            <div>
              <label className="block mb-1">Bengali Title (বাংলা নাম)</label>
              <input
                type="text"
                value={editingProduct.bengaliName || ""}
                onChange={(e) =>
                  setEditingProduct({ ...editingProduct, bengaliName: e.target.value })
                }
                className={legacyInputCls}
              />
            </div>
            <div>
              <label className="block mb-1">Store Category *</label>
              <select
                value={editingProduct.category || "light-shades"}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    category: e.target.value as PillarId,
                  })
                }
                className={legacyInputCls}
              >
                {(data.categories || []).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.shortName})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block mb-1">Product Type *</label>
              <select
                value={editingProduct.collectionId || ""}
                onChange={(e) => {
                  const colId = e.target.value;
                  const isDrop = Boolean(colId);
                  setEditingProduct({
                    ...editingProduct,
                    collectionId: colId,
                    stockQty: isDrop
                      ? editingProduct.status === "sold"
                        ? 0
                        : 1
                      : Math.max(1, editingProduct.stockQty || 8),
                    statusLabel: isDrop
                      ? editingProduct.status === "sold"
                        ? "Acquired"
                        : "One of One"
                      : "In Stock",
                  });
                }}
                className={legacyInputCls}
              >
                <option value="">Regular Store Product (Multi-Stock)</option>
                {data.collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    Exclusive Collection: {c.dropNumber || c.shortName} — {c.title} (1 of 1)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1">SKU</label>
              <input
                type="text"
                value={editingProduct.sku || ""}
                onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                className={legacyInputCls}
              />
            </div>

            <div>
              <label className="block mb-1">Selling Price (BDT ৳) *</label>
              <input
                type="number"
                value={editingProduct.priceBDT ?? 0}
                onChange={(e) =>
                  setEditingProduct({ ...editingProduct, priceBDT: Number(e.target.value) })
                }
                className={`${legacyInputCls} font-num`}
              />
            </div>
            <div>
              <label className="block mb-1">Unit Cost (BDT ৳)</label>
              <input
                type="number"
                value={editingProduct.costBDT ?? 0}
                onChange={(e) =>
                  setEditingProduct({ ...editingProduct, costBDT: Number(e.target.value) })
                }
                className={`${legacyInputCls} font-num`}
              />
            </div>
            <div>
              <label className="block mb-1">Artisan Hours</label>
              <input
                type="number"
                value={editingProduct.artisanHours ?? 40}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    artisanHours: Number(e.target.value),
                    artisanHoursLabel: `${e.target.value} Hours Handcrafted`,
                  })
                }
                className={`${legacyInputCls} font-num`}
              />
            </div>

            <div>
              <label className="block mb-1">Availability Status</label>
              <select
                value={editingProduct.status || "ready"}
                onChange={(e) => {
                  const nextSt = e.target.value as ProductStatus;
                  const isDrop = Boolean(editingProduct.collectionId);
                  setEditingProduct({
                    ...editingProduct,
                    status: nextSt,
                    stockQty:
                      nextSt === "sold"
                        ? 0
                        : isDrop
                        ? 1
                        : Math.max(1, editingProduct.stockQty ?? 8),
                  });
                }}
                className={legacyInputCls}
              >
                <option value="ready">
                  {editingProduct.collectionId ? "Available (1 of 1)" : "In Stock"}
                </option>
                {!editingProduct.collectionId && <option value="limited">Low Stock Alert</option>}
                <option value="waitlist">Pre-Booking / Reservation</option>
                <option value="sold">
                  {editingProduct.collectionId ? "Acquired" : "Sold Out"}
                </option>
                <option value="hidden">Hidden (Draft)</option>
              </select>
            </div>

            <div>
              <label className="block mb-1">Stock Quantity</label>
              <input
                type="number"
                min={0}
                disabled={Boolean(editingProduct.collectionId)}
                value={
                  editingProduct.collectionId
                    ? editingProduct.status === "sold"
                      ? 0
                      : 1
                    : editingProduct.stockQty ?? 8
                }
                onChange={(e) =>
                  setEditingProduct({ ...editingProduct, stockQty: Number(e.target.value) })
                }
                className={`${legacyInputCls} font-num disabled:opacity-65 disabled:bg-a-subtle`}
              />
            </div>

            <div>
              <label className="block mb-1">
                {editingProduct.collectionId ? "Acquired By" : "Low Stock Alert Threshold"}
              </label>
              {editingProduct.collectionId ? (
                <input
                  type="text"
                  value={editingProduct.acquiredBy || ""}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, acquiredBy: e.target.value })
                  }
                  className={legacyInputCls}
                />
              ) : (
                <input
                  type="number"
                  min={1}
                  value={editingProduct.lowStockThreshold ?? 2}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      lowStockThreshold: Number(e.target.value),
                    })
                  }
                  className={`${legacyInputCls} font-num`}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-a-subtle p-4 rounded-xl border border-a-border text-[13px]">
            <div className="md:col-span-2">
              <img
                src={editingProduct.image || "/images/hero-courtyard.png"}
                alt="Preview"
                className="w-20 h-24 object-cover rounded border border-a-border"
              />
            </div>
            <div className="md:col-span-6 space-y-2">
              <label className="block">Image Path or URL</label>
              <input
                type="text"
                value={editingProduct.image || ""}
                onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                className={legacyInputCls}
              />
            </div>
            <div className="md:col-span-4">
              <label className="admin-press inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink cursor-pointer font-medium">
                <Upload className="w-4 h-4 text-a-accent" />
                {uploadingImg ? "Uploading…" : "Choose Image File"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
            <div className="md:col-span-2">
              <label className="block mb-1">Piece Story</label>
              <textarea
                rows={3}
                value={editingProduct.story || ""}
                onChange={(e) => setEditingProduct({ ...editingProduct, story: e.target.value })}
                className={legacyInputCls}
              />
            </div>
            <div>
              <label className="block mb-1">Materials</label>
              <input
                type="text"
                value={editingProduct.materials || ""}
                onChange={(e) =>
                  setEditingProduct({ ...editingProduct, materials: e.target.value })
                }
                className={legacyInputCls}
              />
            </div>
            <div>
              <label className="block mb-1">Dimensions</label>
              <input
                type="text"
                value={editingProduct.dimensions || ""}
                onChange={(e) =>
                  setEditingProduct({ ...editingProduct, dimensions: e.target.value })
                }
                className={legacyInputCls}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block mb-1">Care Instructions</label>
              <input
                type="text"
                value={editingProduct.care || ""}
                onChange={(e) => setEditingProduct({ ...editingProduct, care: e.target.value })}
                className={legacyInputCls}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              className="admin-press px-4 py-2 rounded-lg bg-a-subtle text-a-text-1 border border-a-border text-[13px] font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                const ok = await postAction(
                  { action: "save_product", product: editingProduct },
                  `Saved "${editingProduct.name}"`
                );
                if (ok) setEditingProduct(null);
              }}
              className="admin-press px-5 py-2 rounded-lg bg-a-ink-btn hover:bg-a-ink-btn-hover text-a-on-ink text-[13px] font-medium cursor-pointer"
            >
              Save Piece to Catalog
            </button>
          </div>
        </div>
      )}

      <div className={`${legacyCardCls} overflow-hidden`}>
        <table className="w-full text-[13px] text-left border-collapse">
          <thead>
            <tr>
              <th className={legacyThCls}>Piece</th>
              <th className={legacyThCls}>Store Category</th>
              <th className={legacyThCls}>Collection / Drop Tag</th>
              <th className={legacyThCls}>Price / Cost</th>
              <th className={legacyThCls}>Stock / Collector</th>
              <th className={legacyThCls}>Status</th>
              <th className={`${legacyThCls} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-a-border">
            {data.products.map((p) => {
              const catObj = (data.categories || []).find((c) => c.id === p.category);
              const isCollectionPiece = Boolean(p.collectionId && p.collectionId.trim() !== "");
              return (
                <tr key={p.id} className="admin-row-hover">
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-12 h-14 rounded object-cover shrink-0 border border-a-border"
                    />
                    <div>
                      <p className="font-medium text-a-text-1">{p.name}</p>
                      <p className="text-a-text-2">{p.bengaliName}</p>
                      <p className="font-mono text-[12px] text-a-text-3">{p.sku}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-a-text-1">
                    {catObj ? `${catObj.name} (${catObj.shortName})` : p.category}
                  </td>
                  <td className="py-3.5 px-4">
                    {isCollectionPiece ? (
                      <span className="inline-block px-2.5 py-1 rounded bg-a-ink-btn text-a-on-ink text-[12px] font-medium">
                        <span className="font-num">{p.dropNumber || "Drop"}</span> · 1 of 1
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 rounded bg-a-subtle text-a-text-2 border border-a-border text-[12px] font-medium">
                        Regular Store
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-num">
                    <p className="font-semibold text-a-text-1">{formatBDT(p.priceBDT)}</p>
                    <p className="text-a-text-3 text-[12px]">Cost: {formatBDT(p.costBDT)}</p>
                  </td>
                  <td className="py-3.5 px-4 font-num">
                    {isCollectionPiece ? (
                      <div>
                        <span className="px-2 py-0.5 rounded bg-a-accent-soft text-a-accent-text text-[12px] font-medium">
                          1 of 1 ({p.status === "sold" ? "Acquired" : "Available"})
                        </span>
                        {p.acquiredBy && (
                          <p className="text-[12px] font-medium text-a-success mt-1">
                            Acquired by {p.acquiredBy}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="font-medium text-a-text-1">
                        {p.stockQty} units in stock
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <LegacyStatusBadge
                      status={
                        p.status === "sold"
                          ? isCollectionPiece
                            ? "acquired"
                            : "sold_out"
                          : p.status
                      }
                    />
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(p)}
                      className="admin-press px-3 py-1.5 rounded-lg bg-a-subtle hover:bg-a-subtle-hover text-a-text-1 border border-a-border font-medium cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        postAction(
                          { action: "delete_product", id: p.id },
                          `Deleted ${p.name}`
                        )
                      }
                      aria-label={`Delete ${p.name}`}
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
  );
}
