"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Edit3,
  ExternalLink,
  Layers,
  LayoutGrid,
  List,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { DropStatus, NOKSHA_PALETTE } from "@/data/nokshaData";
import { DbCategory, DbCollection } from "@/lib/db";
import { useAdmin } from "../hooks/useAdminData";
import {
  Button,
  ColumnDef,
  ConfirmDialog,
  DataTable,
  Drawer,
  DropdownMenu,
  EmptyState,
  Field,
  IconButton,
  Input,
  PageHeader,
  SegmentedControl,
  Select,
  StatusBadge,
  Textarea,
} from "../ui";

function makeEmptyCollection(nextNum: number): Partial<DbCollection> {
  const label = `Drop 0${nextNum}`;
  return {
    id: "",
    dropNumber: label,
    shortName: label,
    title: "",
    bengaliTitle: "",
    subtitle: "",
    description: "",
    story: "",
    craftMetric: "Exclusive 1-of-1 Drop · Handcrafted in Bangladesh",
    priceRange: "৳ 6,500 – ৳ 18,000",
    heroImage: "/images/hero-courtyard.png",
    bannerImage: "/images/hero-courtyard.png",
    accentHex: NOKSHA_PALETTE.gold,
    exclusivity: "one_of_one",
    dropStatus: "upcoming",
    releaseDate: "Upcoming Drop",
    sortOrder: nextNum,
    active: true,
  };
}

function makeEmptyCategory(nextSort: number): Partial<DbCategory> {
  return {
    id: "",
    shortName: "",
    name: "",
    bengaliName: "",
    subtitle: "",
    sortOrder: nextSort,
    active: true,
  };
}

export default function CollectionsTab() {
  const { data, postAction, notify, triggerNewCounter } = useAdmin();

  const [subTab, setSubTab] = useState<"drops" | "categories">("drops");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Drop Drawer state
  const [editingCollection, setEditingCollection] = useState<Partial<DbCollection> | null>(null);
  const [colSnapshot, setColSnapshot] = useState("");
  const [colErrors, setColErrors] = useState<Record<string, string>>({});
  const [uploadingField, setUploadingField] = useState<"heroImage" | "bannerImage" | null>(null);
  const [savingCol, setSavingCol] = useState(false);

  // Category Drawer state
  const [editingCategory, setEditingCategory] = useState<Partial<DbCategory> | null>(null);
  const [catSnapshot, setCatSnapshot] = useState("");
  const [catErrors, setCatErrors] = useState<Record<string, string>>({});
  const [savingCat, setSavingCat] = useState(false);

  // Delete confirmation dialogs
  const [deleteColTarget, setDeleteColTarget] = useState<DbCollection | null>(null);
  const [deleteCatTarget, setDeleteCatTarget] = useState<DbCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const lastTriggerRef = useRef(triggerNewCounter);

  const openCollectionDrawer = (col: Partial<DbCollection>) => {
    setEditingCollection(col);
    setColSnapshot(JSON.stringify(col));
    setColErrors({});
  };

  const openCategoryDrawer = (cat: Partial<DbCategory>) => {
    setEditingCategory(cat);
    setCatSnapshot(JSON.stringify(cat));
    setCatErrors({});
  };

  useEffect(() => {
    if (triggerNewCounter !== lastTriggerRef.current) {
      lastTriggerRef.current = triggerNewCounter;
      if (subTab === "categories") {
        openCategoryDrawer(makeEmptyCategory((data.categories?.length ?? 3) + 1));
      } else {
        openCollectionDrawer(makeEmptyCollection(data.collections.length + 1));
      }
    }
  }, [data.categories?.length, data.collections.length, subTab, triggerNewCounter]);

  const isColDirty = useMemo(() => {
    if (!editingCollection) return false;
    return JSON.stringify(editingCollection) !== colSnapshot;
  }, [editingCollection, colSnapshot]);

  const isCatDirty = useMemo(() => {
    if (!editingCategory) return false;
    return JSON.stringify(editingCategory) !== catSnapshot;
  }, [editingCategory, catSnapshot]);

  const uploadCollectionImage = async (file: File, field: "heroImage" | "bannerImage") => {
    if (!file || !editingCollection) return;
    setUploadingField(field);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const out = await res.json();
      if (res.ok && out.url) {
        setEditingCollection((prev) => ({
          ...prev,
          [field]: out.url,
          ...(field === "heroImage" && !prev?.bannerImage ? { bannerImage: out.url } : {}),
        }));
        notify("Uploaded Drop image");
      } else {
        notify(out.error || "Upload failed", { variant: "error" });
      }
    } catch {
      notify("Upload error", { variant: "error" });
    } finally {
      setUploadingField(null);
    }
  };

  const saveCollection = async () => {
    if (!editingCollection) return;
    const errs: Record<string, string> = {};
    if (!editingCollection.dropNumber?.trim()) errs.dropNumber = "Drop number is required.";
    if (!editingCollection.title?.trim()) errs.title = "Collection title is required.";
    if (!editingCollection.heroImage?.trim()) errs.heroImage = "Card image is required.";
    if (Object.keys(errs).length > 0) {
      setColErrors(errs);
      return;
    }
    setSavingCol(true);
    const ok = await postAction(
      { action: "save_collection", collection: editingCollection },
      `Saved "${editingCollection.dropNumber} — ${editingCollection.title}"`
    );
    setSavingCol(false);
    if (ok) {
      setColSnapshot(JSON.stringify(editingCollection));
      setEditingCollection(null);
    }
  };

  const saveCategory = async () => {
    if (!editingCategory) return;
    const errs: Record<string, string> = {};
    if (!editingCategory.name?.trim()) errs.name = "Category name is required.";
    if (Object.keys(errs).length > 0) {
      setCatErrors(errs);
      return;
    }
    setSavingCat(true);
    const ok = await postAction(
      { action: "save_category", category: editingCategory },
      `Saved category "${editingCategory.name}"`
    );
    setSavingCat(false);
    if (ok) {
      setCatSnapshot(JSON.stringify(editingCategory));
      setEditingCategory(null);
    }
  };

  const dropColumns: ColumnDef<DbCollection>[] = [
    {
      key: "drop",
      header: "Drop",
      sortValue: (c) => c.sortOrder,
      render: (col) => (
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={col.heroImage}
            alt={col.title}
            className="w-11 h-13 rounded-[6px] object-cover border border-a-border shrink-0 bg-a-subtle"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-num px-2 py-0.5 rounded bg-a-ink-btn text-a-on-ink text-[12px] font-medium">
                {col.dropNumber || col.shortName}
              </span>
              <span className="font-medium text-a-text-1 truncate">{col.title}</span>
            </div>
            <p className="text-[12px] text-a-text-3 truncate mt-0.5">
              {col.bengaliTitle} · /collections/{col.id}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "pieces",
      header: "1-of-1 Pieces",
      numeric: true,
      render: (col) => {
        const count = data.products.filter((p) => p.collectionId === col.id).length;
        return (
          <span className="font-num font-medium text-a-text-1">
            {count} {count === 1 ? "piece" : "pieces"}
          </span>
        );
      },
    },
    {
      key: "stage",
      header: "Release Stage",
      render: (col) => (
        <div className="w-44" onClick={(e) => e.stopPropagation()}>
          <Select
            aria-label={`Release stage for ${col.title}`}
            value={col.dropStatus || "live"}
            onChange={(e) =>
              postAction(
                {
                  action: "save_collection",
                  collection: { ...col, dropStatus: e.target.value as DropStatus },
                },
                `Updated ${col.dropNumber} stage to ${e.target.value}`
              )
            }
          >
            <option value="upcoming">Upcoming Preview</option>
            <option value="prebooking">Open for Pre-Booking</option>
            <option value="live">Live Drop</option>
            <option value="archived">Archived Drop</option>
          </Select>
        </div>
      ),
    },
    {
      key: "timing",
      header: "Timing",
      render: (col) => (
        <span className="font-num text-[13px] text-a-text-2">
          {col.releaseDate || "Live Now"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (col) => (
        <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/collections/${col.id}`}
            target="_blank"
            aria-label={`Open ${col.title} page`}
            className="admin-press inline-flex items-center justify-center w-8 h-8 rounded-[8px] text-a-text-2 hover:text-a-text-1 hover:bg-a-subtle"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <DropdownMenu
            label={`Actions for ${col.title}`}
            items={[
              {
                label: "Edit Drop",
                icon: <Edit3 className="w-3.5 h-3.5" />,
                onClick: () => openCollectionDrawer(col),
              },
              {
                label: "Delete Drop",
                icon: <Trash2 className="w-3.5 h-3.5" />,
                danger: true,
                onClick: () => setDeleteColTarget(col),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  const categoryColumns: ColumnDef<DbCategory>[] = [
    {
      key: "order",
      header: "Order",
      numeric: true,
      sortValue: (c) => c.sortOrder,
      render: (c) => <span className="font-num font-medium text-a-text-2">#{c.sortOrder}</span>,
    },
    {
      key: "name",
      header: "Category",
      render: (cat) => (
        <div>
          <p className="font-medium text-a-text-1">
            {cat.name} <span className="text-a-text-3">({cat.shortName})</span>
          </p>
          <p className="text-[12px] text-a-text-3">{cat.bengaliName}</p>
        </div>
      ),
    },
    {
      key: "subtitle",
      header: "Subtitle",
      render: (cat) => <span className="text-[13px] text-a-text-2">{cat.subtitle}</span>,
    },
    {
      key: "counts",
      header: "Catalog Breakdown",
      numeric: true,
      render: (cat) => {
        const list = data.products.filter((p) => p.category === cat.id);
        const storeCount = list.filter((p) => !p.collectionId).length;
        const dropCount = list.filter((p) => Boolean(p.collectionId)).length;
        return (
          <span className="font-num text-[13px] text-a-text-2">
            {storeCount} store · {dropCount} drop
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (cat) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu
            label={`Actions for ${cat.name}`}
            items={[
              {
                label: "Edit category",
                icon: <Edit3 className="w-3.5 h-3.5" />,
                onClick: () => openCategoryDrawer(cat),
              },
              {
                label: "Delete category",
                icon: <Trash2 className="w-3.5 h-3.5" />,
                danger: true,
                onClick: () => setDeleteCatTarget(cat),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drops & Categories"
        description="Curate numbered 1-of-1 Collector Drops alongside signature store product categories."
        actions={
          subTab === "drops" ? (
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4 text-a-accent" />}
              kbd="N"
              onClick={() => openCollectionDrawer(makeEmptyCollection(data.collections.length + 1))}
            >
              New Exclusive Drop
            </Button>
          ) : (
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4 text-a-accent" />}
              kbd="N"
              onClick={() => openCategoryDrawer(makeEmptyCategory((data.categories?.length ?? 3) + 1))}
            >
              New Category
            </Button>
          )
        }
        toolbar={
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <SegmentedControl
              value={subTab}
              onChange={setSubTab}
              options={[
                { id: "drops", label: "Exclusive Drops", count: data.collections.length },
                { id: "categories", label: "Store Categories", count: (data.categories || []).length },
              ]}
            />

            {subTab === "drops" && (
              <div
                role="group"
                aria-label="Drop view mode"
                className="inline-flex items-center p-1 rounded-[8px] bg-a-subtle border border-a-border"
              >
                <IconButton
                  aria-label="Table view"
                  tooltip="Table view"
                  onClick={() => setViewMode("table")}
                  className={viewMode === "table" ? "!bg-a-surface shadow-[var(--a-shadow-card)] !text-a-text-1" : ""}
                >
                  <List className="w-4 h-4" />
                </IconButton>
                <IconButton
                  aria-label="Grid view"
                  tooltip="Grid view"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "!bg-a-surface shadow-[var(--a-shadow-card)] !text-a-text-1" : ""}
                >
                  <LayoutGrid className="w-4 h-4" />
                </IconButton>
              </div>
            )}
          </div>
        }
      />

      {subTab === "drops" ? (
        viewMode === "table" ? (
          <DataTable
            columns={dropColumns}
            rows={data.collections}
            getRowId={(c) => c.id}
            onRowClick={(c) => openCollectionDrawer(c)}
            emptyState={
              <EmptyState
                icon={<Layers className="w-5 h-5" />}
                title="No Exclusive Drops yet"
                description="Create your first numbered 1-of-1 release to showcase collector pieces."
              />
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.collections.map((col) => {
              const count = data.products.filter((p) => p.collectionId === col.id).length;
              return (
                <div
                  key={col.id}
                  onClick={() => openCollectionDrawer(col)}
                  className="admin-kpi-card bg-a-surface border border-a-border rounded-[14px] overflow-hidden shadow-[var(--a-shadow-card)] cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-[16/10] bg-a-subtle overflow-hidden">
                    <img
                      src={col.bannerImage || col.heroImage}
                      alt={col.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="font-num absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-a-ink-btn text-a-on-ink text-[12px] font-medium">
                      {col.dropNumber || col.shortName}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <p className="font-semibold text-a-text-1">{col.title}</p>
                      <p className="text-[12px] text-a-text-3 mt-0.5">{col.bengaliTitle}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-a-border text-[12px]">
                      <span className="font-num text-a-text-2">{count} 1-of-1 pieces</span>
                      <StatusBadge status={col.dropStatus || "live"} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <DataTable
          columns={categoryColumns}
          rows={data.categories || []}
          getRowId={(c) => c.id}
          onRowClick={(c) => openCategoryDrawer(c)}
          emptyState={
            <EmptyState
              icon={<Layers className="w-5 h-5" />}
              title="No store categories configured"
              description="Add product categories like Light Shades, Nakshi Kanthas, and Wooden Jewelry Boxes."
            />
          }
        />
      )}

      {/* Exclusive Drop Drawer */}
      <Drawer
        open={Boolean(editingCollection)}
        onClose={() => setEditingCollection(null)}
        isDirty={isColDirty}
        widthCls="sm:max-w-[560px]"
        title={
          editingCollection?.id
            ? `Edit ${editingCollection.dropNumber || "Drop"}`
            : "Create Exclusive Drop"
        }
        subtitle="All pieces assigned to a Drop are strictly 1 of 1."
        footer={
          <>
            <div />
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setEditingCollection(null)}>
                Cancel
              </Button>
              <Button variant="primary" loading={savingCol} onClick={saveCollection}>
                Save Drop
              </Button>
            </div>
          </>
        }
      >
        {editingCollection && (
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-[12px] uppercase tracking-[0.04em] font-semibold text-a-text-3">
                Basics &amp; Release Control
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Drop number" required error={colErrors.dropNumber}>
                  <Input
                    numeral
                    error={Boolean(colErrors.dropNumber)}
                    value={editingCollection.dropNumber || ""}
                    onChange={(e) =>
                      setEditingCollection({
                        ...editingCollection,
                        dropNumber: e.target.value,
                        shortName: e.target.value,
                      })
                    }
                    placeholder="e.g. Drop 04"
                  />
                </Field>
                <Field label="Release stage">
                  <Select
                    value={editingCollection.dropStatus || "live"}
                    onChange={(e) =>
                      setEditingCollection({
                        ...editingCollection,
                        dropStatus: e.target.value as DropStatus,
                      })
                    }
                  >
                    <option value="upcoming">Upcoming Preview</option>
                    <option value="prebooking">Open for Pre-Booking</option>
                    <option value="live">Live Drop</option>
                    <option value="archived">Archived Drop</option>
                  </Select>
                </Field>
                <Field label="Collection title" required error={colErrors.title} className="sm:col-span-2">
                  <Input
                    error={Boolean(colErrors.title)}
                    value={editingCollection.title || ""}
                    onChange={(e) =>
                      setEditingCollection({ ...editingCollection, title: e.target.value })
                    }
                    placeholder="e.g. Winter Nakshi & Brass Collector Drop"
                  />
                </Field>
                <Field label="Bengali title (বাংলা নাম)">
                  <Input
                    value={editingCollection.bengaliTitle || ""}
                    onChange={(e) =>
                      setEditingCollection({ ...editingCollection, bengaliTitle: e.target.value })
                    }
                  />
                </Field>
                <Field label="Release timing label">
                  <Input
                    numeral
                    value={editingCollection.releaseDate || ""}
                    onChange={(e) =>
                      setEditingCollection({ ...editingCollection, releaseDate: e.target.value })
                    }
                    placeholder="e.g. Live Now / Dec 15, 2026"
                  />
                </Field>
                <Field label="Poetic subtitle">
                  <Input
                    value={editingCollection.subtitle || ""}
                    onChange={(e) =>
                      setEditingCollection({ ...editingCollection, subtitle: e.target.value })
                    }
                  />
                </Field>
                <Field label="Price range (BDT ৳)">
                  <Input
                    numeral
                    value={editingCollection.priceRange || ""}
                    onChange={(e) =>
                      setEditingCollection({ ...editingCollection, priceRange: e.target.value })
                    }
                  />
                </Field>
                <Field label="Craft hours metric">
                  <Input
                    numeral
                    value={editingCollection.craftMetric || ""}
                    onChange={(e) =>
                      setEditingCollection({ ...editingCollection, craftMetric: e.target.value })
                    }
                  />
                </Field>
                <Field label="Sort order">
                  <Input
                    type="number"
                    numeral
                    value={editingCollection.sortOrder ?? 1}
                    onChange={(e) =>
                      setEditingCollection({
                        ...editingCollection,
                        sortOrder: Number(e.target.value),
                      })
                    }
                  />
                </Field>
              </div>
            </section>

            <section className="space-y-3 pt-4 border-t border-a-border">
              <h3 className="text-[12px] uppercase tracking-[0.04em] font-semibold text-a-text-3">
                Media
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-[10px] bg-a-subtle border border-a-border space-y-2">
                  <img
                    src={editingCollection.heroImage || "/images/hero-courtyard.png"}
                    alt="Card preview"
                    className="w-full h-32 object-cover rounded-[6px] border border-a-border"
                  />
                  <Field label="Card image (4:5)" required error={colErrors.heroImage}>
                    <Input
                      value={editingCollection.heroImage || ""}
                      onChange={(e) =>
                        setEditingCollection({ ...editingCollection, heroImage: e.target.value })
                      }
                    />
                  </Field>
                  <label className="admin-press inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-a-surface border border-a-border text-[12px] font-medium cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-a-accent" />
                    <span>{uploadingField === "heroImage" ? "Uploading…" : "Upload card"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files?.[0] && uploadCollectionImage(e.target.files[0], "heroImage")
                      }
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="p-3 rounded-[10px] bg-a-subtle border border-a-border space-y-2">
                  <img
                    src={
                      editingCollection.bannerImage ||
                      editingCollection.heroImage ||
                      "/images/hero-courtyard.png"
                    }
                    alt="Banner preview"
                    className="w-full h-32 object-cover rounded-[6px] border border-a-border"
                  />
                  <Field label="Banner image (wide)">
                    <Input
                      value={editingCollection.bannerImage || ""}
                      onChange={(e) =>
                        setEditingCollection({ ...editingCollection, bannerImage: e.target.value })
                      }
                    />
                  </Field>
                  <label className="admin-press inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-a-surface border border-a-border text-[12px] font-medium cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-a-accent" />
                    <span>{uploadingField === "bannerImage" ? "Uploading…" : "Upload banner"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        uploadCollectionImage(e.target.files[0], "bannerImage")
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className="space-y-3 pt-4 border-t border-a-border">
              <h3 className="text-[12px] uppercase tracking-[0.04em] font-semibold text-a-text-3">
                Story &amp; Visibility
              </h3>
              <Field label="Summary description">
                <Textarea
                  rows={2}
                  value={editingCollection.description || ""}
                  onChange={(e) =>
                    setEditingCollection({ ...editingCollection, description: e.target.value })
                  }
                />
              </Field>
              <Field label="Dedicated Drop page story">
                <Textarea
                  rows={4}
                  value={editingCollection.story || ""}
                  onChange={(e) =>
                    setEditingCollection({ ...editingCollection, story: e.target.value })
                  }
                />
              </Field>
              <label className="inline-flex items-center gap-2 text-[13px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingCollection.active !== false}
                  onChange={(e) =>
                    setEditingCollection({ ...editingCollection, active: e.target.checked })
                  }
                  className="w-4 h-4 accent-[var(--a-ink-btn)]"
                />
                <span className="font-medium text-a-text-1">Visible on storefront</span>
              </label>
            </section>
          </div>
        )}
      </Drawer>

      {/* Store Category Drawer */}
      <Drawer
        open={Boolean(editingCategory)}
        onClose={() => setEditingCategory(null)}
        isDirty={isCatDirty}
        widthCls="sm:max-w-[460px]"
        title={
          editingCategory?.id ? `Edit category · ${editingCategory.name}` : "New store category"
        }
        subtitle="Used for filtering multi-stock pieces and collector works."
        footer={
          <>
            <div />
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setEditingCategory(null)}>
                Cancel
              </Button>
              <Button variant="primary" loading={savingCat} onClick={saveCategory}>
                Save category
              </Button>
            </div>
          </>
        }
      >
        {editingCategory && (
          <div className="space-y-4">
            <Field label="Category name" required error={catErrors.name}>
              <Input
                error={Boolean(catErrors.name)}
                value={editingCategory.name || ""}
                onChange={(e) =>
                  setEditingCategory({ ...editingCategory, name: e.target.value })
                }
                placeholder="e.g. Wooden Jewelry Boxes"
              />
            </Field>
            <Field label="Short heritage label">
              <Input
                value={editingCategory.shortName || ""}
                onChange={(e) =>
                  setEditingCategory({ ...editingCategory, shortName: e.target.value })
                }
                placeholder="e.g. Alo, Kantha, Boxes"
              />
            </Field>
            <Field label="Bengali name (বাংলা নাম)">
              <Input
                value={editingCategory.bengaliName || ""}
                onChange={(e) =>
                  setEditingCategory({ ...editingCategory, bengaliName: e.target.value })
                }
              />
            </Field>
            <Field label="Category subtitle">
              <Textarea
                rows={2}
                value={editingCategory.subtitle || ""}
                onChange={(e) =>
                  setEditingCategory({ ...editingCategory, subtitle: e.target.value })
                }
              />
            </Field>
            <Field label="Sort order">
              <Input
                type="number"
                numeral
                value={editingCategory.sortOrder ?? 1}
                onChange={(e) =>
                  setEditingCategory({
                    ...editingCategory,
                    sortOrder: Number(e.target.value),
                  })
                }
              />
            </Field>
          </div>
        )}
      </Drawer>

      {/* Delete Drop Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteColTarget)}
        title={deleteColTarget ? `Delete "${deleteColTarget.title}"?` : "Delete Drop?"}
        description={
          deleteColTarget
            ? `This deletes ${deleteColTarget.dropNumber} (${deleteColTarget.title}). Any pieces inside it will remain in your catalog as regular store pieces.`
            : ""
        }
        confirmLabel="Delete Drop"
        danger
        loading={deleting}
        onCancel={() => setDeleteColTarget(null)}
        onConfirm={async () => {
          if (!deleteColTarget) return;
          setDeleting(true);
          await postAction(
            { action: "delete_collection", id: deleteColTarget.id },
            `Deleted ${deleteColTarget.title}`
          );
          setDeleting(false);
          setDeleteColTarget(null);
        }}
      />

      {/* Delete Category Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteCatTarget)}
        title={deleteCatTarget ? `Delete category "${deleteCatTarget.name}"?` : "Delete category?"}
        description={
          deleteCatTarget
            ? `This removes the "${deleteCatTarget.name}" filter category from the storefront.`
            : ""
        }
        confirmLabel="Delete category"
        danger
        loading={deleting}
        onCancel={() => setDeleteCatTarget(null)}
        onConfirm={async () => {
          if (!deleteCatTarget) return;
          setDeleting(true);
          await postAction(
            { action: "delete_category", id: deleteCatTarget.id },
            `Deleted category ${deleteCatTarget.name}`
          );
          setDeleting(false);
          setDeleteCatTarget(null);
        }}
      />
    </div>
  );
}
