"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Edit3,
  GripVertical,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Package,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { formatBDT, NOKSHA_PALETTE, PillarId, ProductStatus } from "@/data/nokshaData";
import { DbProduct } from "@/lib/db";
import { useAdmin } from "../hooks/useAdminData";
import {
  Badge,
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
  SearchInput,
  SegmentedControl,
  Select,
  StatusBadge,
  Textarea,
} from "../ui";

const DEFAULT_ACCENT = NOKSHA_PALETTE.gold;

function makeEmptyProduct(): Partial<DbProduct> {
  return {
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
    accentColor: DEFAULT_ACCENT,
    colors: [{ name: "Signature", hex: DEFAULT_ACCENT }],
  };
}

export default function ProductsTab() {
  const {
    data,
    postAction,
    notify,
    queryParams,
    setQueryParam,
    setActiveTab,
    triggerNewCounter,
  } = useAdmin();

  const viewMode = (queryParams.get("view") === "grid" ? "grid" : "table") as "table" | "grid";
  const categoryFilter = queryParams.get("cat") || "all";
  const editParam = queryParams.get("edit") || null;

  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<Partial<DbProduct> | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");
  const [altTextDraft, setAltTextDraft] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Upload & drag-reorder state
  const [uploadingImg, setUploadingImg] = useState(false);
  const [dragOverZone, setDragOverZone] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Dialogs (replacing confirm/prompt)
  const [deleteTarget, setDeleteTarget] = useState<DbProduct | null>(null);
  const [soldTarget, setSoldTarget] = useState<DbProduct | null>(null);
  const [dialogBusy, setDialogBusy] = useState(false);

  const lastTriggerRef = useRef(triggerNewCounter);

  const openEditor = (prod: Partial<DbProduct>) => {
    const normalizedGallery =
      prod.gallery && prod.gallery.length > 0
        ? prod.gallery
        : prod.image
        ? [prod.image]
        : [];
    const draft = { ...prod, gallery: normalizedGallery };
    setEditingProduct(draft);
    setInitialSnapshot(JSON.stringify(draft));
    setAltTextDraft(prod.name || "");
    setErrors({});
  };

  const closeEditor = () => {
    setEditingProduct(null);
    setErrors({});
    if (editParam) setQueryParam("edit", null);
  };

  useEffect(() => {
    if (triggerNewCounter !== lastTriggerRef.current) {
      lastTriggerRef.current = triggerNewCounter;
      openEditor(makeEmptyProduct());
    }
  }, [triggerNewCounter]);

  useEffect(() => {
    if (editParam) {
      const found = data.products.find((p) => p.id === editParam);
      if (found && editingProduct?.id !== found.id) {
        openEditor(found);
      }
    }
  }, [data.products, editParam, editingProduct?.id]);

  const isDirty = useMemo(() => {
    if (!editingProduct) return false;
    return JSON.stringify(editingProduct) !== initialSnapshot;
  }, [editingProduct, initialSnapshot]);

  // Map buyer orders by product ID or name for "Acquired" order link
  const buyerOrderMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of data.orders) {
      if (o.status === "cancelled") continue;
      for (const it of o.items) {
        if (it.productId && !m.has(it.productId)) m.set(it.productId, o.id);
        if (it.name && !m.has(it.name)) m.set(it.name, o.id);
      }
    }
    return m;
  }, [data.orders]);

  const filteredProducts = useMemo(() => {
    return data.products.filter((p) => {
      if (categoryFilter === "drops") {
        if (!p.collectionId) return false;
      } else if (categoryFilter !== "all" && p.category !== categoryFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.bengaliName && p.bengaliName.toLowerCase().includes(q)) ||
          p.sku.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data.products, categoryFilter, search]);

  const uploadFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (!arr.length || !editingProduct) return;
    setUploadingImg(true);
    try {
      for (const file of arr) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const out = await res.json();
        if (res.ok && out.url) {
          setEditingProduct((prev) => {
            if (!prev) return prev;
            const prevGal = prev.gallery || [];
            const nextGal = prevGal.includes(out.url) ? prevGal : [...prevGal, out.url];
            return {
              ...prev,
              image: prev.image || out.url,
              gallery: nextGal,
            };
          });
        } else {
          notify(out.error || "Upload failed", { variant: "error" });
        }
      }
      notify("Uploaded piece media");
    } catch {
      notify("Upload error", { variant: "error" });
    } finally {
      setUploadingImg(false);
    }
  };

  const validateAndSave = async () => {
    if (!editingProduct) return;
    const nextErrors: Record<string, string> = {};

    if (!editingProduct.name || !editingProduct.name.trim()) {
      nextErrors.name = "Product title is required.";
    }
    if (!editingProduct.priceBDT || editingProduct.priceBDT <= 0) {
      nextErrors.priceBDT = "Selling price must be greater than ৳0.";
    }

    const candidateSlug = (
      editingProduct.id ||
      editingProduct.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") ||
      ""
    ).trim();

    const duplicate = data.products.find(
      (p) =>
        p.id !== editingProduct.id &&
        ((candidateSlug && p.id === candidateSlug) ||
          (editingProduct.sku &&
            editingProduct.sku.trim() !== "" &&
            p.sku.toLowerCase() === editingProduct.sku.trim().toLowerCase()))
    );
    if (duplicate) {
      nextErrors.sku = `SKU or slug conflicts with "${duplicate.name}".`;
    }

    const gallery = (editingProduct.gallery || []).filter(Boolean);
    const cover = editingProduct.image?.trim() || gallery[0] || "";
    if (!cover) {
      nextErrors.image = "At least one product image is required.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    const payload: Partial<DbProduct> = {
      ...editingProduct,
      image: cover,
      gallery: gallery.includes(cover) ? gallery : [cover, ...gallery],
    };
    const ok = await postAction(
      { action: "save_product", product: payload },
      `Saved "${editingProduct.name}"`
    );
    setSaving(false);
    if (ok) {
      setInitialSnapshot(JSON.stringify(payload));
      closeEditor();
    }
  };

  const renderStockBadge = (p: DbProduct) => {
    const isDrop = Boolean(p.collectionId && p.collectionId.trim() !== "");
    if (isDrop) {
      const orderId = buyerOrderMap.get(p.id) || buyerOrderMap.get(p.name);
      if (p.status === "sold") {
        return (
          <div className="space-y-0.5">
            <Badge tone="accent" dot>
              Acquired · 1 of 1
            </Badge>
            {(p.acquiredBy || orderId) && (
              <div className="text-[12px] text-a-text-3">
                {p.acquiredBy && <span>{p.acquiredBy} </span>}
                {orderId && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab("orders", { order: orderId });
                    }}
                    className="font-num text-a-accent-text hover:underline cursor-pointer"
                  >
                    ({orderId})
                  </button>
                )}
              </div>
            )}
          </div>
        );
      }
      return (
        <Badge tone="info" dot>
          <span className="font-num">1 of 1</span> Available
        </Badge>
      );
    }

    if (p.status === "sold" || p.stockQty <= 0) {
      return (
        <Badge tone="danger" dot>
          Sold out (<span className="font-num">0</span>)
        </Badge>
      );
    }
    if (p.stockQty <= p.lowStockThreshold) {
      return (
        <Badge tone="warning" dot>
          Low · <span className="font-num">{p.stockQty}</span> left
        </Badge>
      );
    }
    return (
      <Badge tone="success" dot>
        In stock · <span className="font-num">{p.stockQty}</span>
      </Badge>
    );
  };

  const columns: ColumnDef<DbProduct>[] = [
    {
      key: "piece",
      header: "Piece",
      sortValue: (p) => p.name,
      render: (p) => (
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={p.image}
            alt={p.name}
            className="w-11 h-13 rounded-[6px] object-cover border border-a-border shrink-0 bg-a-subtle"
          />
          <div className="min-w-0">
            <p className="font-medium text-a-text-1 truncate">{p.name}</p>
            <p className="text-[12px] text-a-text-3 truncate">
              <span className="font-num">{p.sku}</span>
              {p.bengaliName ? ` · ${p.bengaliName}` : ""}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category / Edition",
      render: (p) => {
        const cat = (data.categories || []).find((c) => c.id === p.category);
        const isDrop = Boolean(p.collectionId && p.collectionId.trim() !== "");
        return (
          <div className="space-y-0.5">
            <p className="text-[13px] text-a-text-1">{cat ? cat.name : p.category}</p>
            {isDrop ? (
              <span className="font-num text-[12px] text-a-accent-text font-medium">
                {p.dropNumber || "Exclusive Drop"} · 1 of 1
              </span>
            ) : (
              <span className="text-[12px] text-a-text-3">Store edition</span>
            )}
          </div>
        );
      },
    },
    {
      key: "stock",
      header: "Stock",
      sortValue: (p) => p.stockQty,
      render: (p) => renderStockBadge(p),
    },
    {
      key: "status",
      header: "Visibility",
      render: (p) => (
        <StatusBadge
          status={
            p.status === "sold"
              ? p.collectionId
                ? "acquired"
                : "sold_out"
              : p.status
          }
        />
      ),
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      numeric: true,
      sortValue: (p) => p.priceBDT,
      render: (p) => (
        <div>
          <p className="font-num font-semibold text-a-text-1">{formatBDT(p.priceBDT)}</p>
          <p className="font-num text-[12px] text-a-text-3">Cost {formatBDT(p.costBDT)}</p>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) => {
        const isDrop = Boolean(p.collectionId && p.collectionId.trim() !== "");
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu
              label={`Actions for ${p.name}`}
              items={[
                {
                  label: "Edit piece",
                  icon: <Edit3 className="w-3.5 h-3.5" />,
                  onClick: () => openEditor(p),
                },
                ...(p.status !== "sold"
                  ? [
                      {
                        label: isDrop ? "Mark Acquired" : "Mark Sold Out",
                        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
                        onClick: () => setSoldTarget(p),
                      },
                    ]
                  : []),
                {
                  label: "Delete piece",
                  icon: <Trash2 className="w-3.5 h-3.5" />,
                  danger: true,
                  onClick: () => setDeleteTarget(p),
                },
              ]}
            />
          </div>
        );
      },
    },
  ];

  const categoryTabs = useMemo(() => {
    const base = [
      { id: "all", label: "All pieces", count: data.products.length },
      ...(data.categories || []).map((c) => ({
        id: c.id,
        label: c.shortName || c.name,
        count: data.products.filter((p) => p.category === c.id).length,
      })),
      {
        id: "drops",
        label: "1-of-1 Drops",
        count: data.products.filter((p) => Boolean(p.collectionId)).length,
      },
    ];
    return base;
  }, [data.categories, data.products]);

  const galleryList = editingProduct?.gallery || (editingProduct?.image ? [editingProduct.image] : []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Inventory"
        description="Manage multi-stock store editions across Light Shades, Nakshi Kanthas, and Wooden Jewelry Boxes alongside singular 1-of-1 Drop pieces."
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4 text-a-accent" />}
            kbd="N"
            onClick={() => openEditor(makeEmptyProduct())}
          >
            New product
          </Button>
        }
        toolbar={
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <SegmentedControl
              value={categoryFilter}
              onChange={(val) => setQueryParam("cat", val)}
              options={categoryTabs}
            />

            <div className="flex items-center gap-2">
              <div className="flex-1 sm:w-64">
                <SearchInput
                  inputRef={(el) => {
                    if (el) el.setAttribute("data-admin-search", "true");
                  }}
                  value={search}
                  onChange={setSearch}
                  placeholder="Search name or SKU…"
                />
              </div>

              <div
                role="group"
                aria-label="View mode"
                className="inline-flex items-center p-1 rounded-[8px] bg-a-subtle border border-a-border"
              >
                <IconButton
                  aria-label="Table view"
                  tooltip="Table view"
                  onClick={() => setQueryParam("view", null)}
                  className={viewMode === "table" ? "!bg-a-surface shadow-[var(--a-shadow-card)] !text-a-text-1" : ""}
                >
                  <List className="w-4 h-4" />
                </IconButton>
                <IconButton
                  aria-label="Grid view"
                  tooltip="Grid view"
                  onClick={() => setQueryParam("view", "grid")}
                  className={viewMode === "grid" ? "!bg-a-surface shadow-[var(--a-shadow-card)] !text-a-text-1" : ""}
                >
                  <LayoutGrid className="w-4 h-4" />
                </IconButton>
              </div>
            </div>
          </div>
        }
      />

      {viewMode === "table" ? (
        <DataTable
          columns={columns}
          rows={filteredProducts}
          getRowId={(p) => p.id}
          onRowClick={(p) => openEditor(p)}
          emptyState={
            <EmptyState
              icon={<Package className="w-5 h-5" />}
              title="No pieces match this filter"
              description="Try clearing your search query or add a new handcrafted piece to the catalog."
              action={
                <Button variant="secondary" size="sm" onClick={() => openEditor(makeEmptyProduct())}>
                  Add new product
                </Button>
              }
            />
          }
        />
      ) : filteredProducts.length === 0 ? (
        <div className="bg-a-surface border border-a-border rounded-[14px]">
          <EmptyState
            icon={<Package className="w-5 h-5" />}
            title="No pieces match this filter"
            description="Try clearing your search query or add a new handcrafted piece."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => openEditor(p)}
              className="admin-kpi-card bg-a-surface border border-a-border rounded-[14px] overflow-hidden shadow-[var(--a-shadow-card)] cursor-pointer flex flex-col"
            >
              <div className="relative aspect-[4/5] bg-a-subtle overflow-hidden">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
                {p.collectionId && (
                  <span className="font-num absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-a-ink-btn text-a-on-ink text-[12px] font-medium">
                    {p.dropNumber || "Drop"} · 1 of 1
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <p className="font-medium text-a-text-1 line-clamp-1">{p.name}</p>
                  <p className="font-num text-[12px] text-a-text-3 mt-0.5">{p.sku}</p>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-a-border">
                  <span className="font-num font-semibold text-a-text-1">
                    {formatBDT(p.priceBDT)}
                  </span>
                  {renderStockBadge(p)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grouped Product Drawer */}
      <Drawer
        open={Boolean(editingProduct)}
        onClose={closeEditor}
        isDirty={isDirty}
        widthCls="sm:max-w-[580px]"
        title={
          editingProduct?.id ? `Edit piece · ${editingProduct.name}` : "New studio piece"
        }
        subtitle="Grouped catalog editor · Changes publish live upon saving."
        footer={
          <>
            <div>
              {editingProduct?.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="!text-a-danger hover:!bg-a-danger-bg"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={() => {
                    const found = data.products.find((x) => x.id === editingProduct.id);
                    if (found) setDeleteTarget(found);
                  }}
                >
                  Delete
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={closeEditor}>
                Cancel
              </Button>
              <Button variant="primary" loading={saving} onClick={validateAndSave}>
                Save piece
              </Button>
            </div>
          </>
        }
      >
        {editingProduct && (
          <div className="space-y-6">
            {/* Section 1: Basics */}
            <section className="space-y-3">
              <h3 className="text-[12px] uppercase tracking-[0.04em] font-semibold text-a-text-3">
                Basics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="English title" required error={errors.name} className="sm:col-span-2">
                  <Input
                    error={Boolean(errors.name)}
                    value={editingProduct.name || ""}
                    onChange={(e) => {
                      setEditingProduct({ ...editingProduct, name: e.target.value });
                      if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    placeholder="e.g. Jamdani Shadow Pendant"
                  />
                </Field>
                <Field label="Bengali title (বাংলা নাম)">
                  <Input
                    value={editingProduct.bengaliName || ""}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, bengaliName: e.target.value })
                    }
                    placeholder="জামদানি ছায়া লণ্ঠন"
                  />
                </Field>
                <Field label="SKU" error={errors.sku}>
                  <Input
                    numeral
                    error={Boolean(errors.sku)}
                    value={editingProduct.sku || ""}
                    onChange={(e) => {
                      setEditingProduct({ ...editingProduct, sku: e.target.value });
                      if (errors.sku) setErrors((prev) => ({ ...prev, sku: "" }));
                    }}
                    placeholder="e.g. NK-STD-012"
                  />
                </Field>
                <Field label="Store category" required>
                  <Select
                    value={editingProduct.category || "light-shades"}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value as PillarId,
                      })
                    }
                  >
                    {(data.categories || []).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.shortName})
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Edition / Drop assignment">
                  <Select
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
                  >
                    <option value="">Regular Store Edition (Multi-stock)</option>
                    {data.collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.dropNumber || c.shortName} — {c.title} (1 of 1)
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </section>

            {/* Section 2: Pricing & Stock */}
            <section className="space-y-3 pt-4 border-t border-a-border">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] uppercase tracking-[0.04em] font-semibold text-a-text-3">
                  Pricing &amp; Stock
                </h3>
                {Number(editingProduct.priceBDT) > 0 && Number(editingProduct.costBDT) > 0 && (
                  <span className="font-num text-[12px] text-a-success font-medium">
                    Est. margin:{" "}
                    {formatBDT(
                      Math.max(0, (editingProduct.priceBDT || 0) - (editingProduct.costBDT || 0))
                    )}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Selling price (BDT ৳)" required error={errors.priceBDT}>
                  <Input
                    type="number"
                    numeral
                    error={Boolean(errors.priceBDT)}
                    value={editingProduct.priceBDT ?? 0}
                    onChange={(e) => {
                      setEditingProduct({ ...editingProduct, priceBDT: Number(e.target.value) });
                      if (errors.priceBDT) setErrors((prev) => ({ ...prev, priceBDT: "" }));
                    }}
                  />
                </Field>
                <Field label="Unit cost (BDT ৳)">
                  <Input
                    type="number"
                    numeral
                    value={editingProduct.costBDT ?? 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, costBDT: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Artisan hours">
                  <Input
                    type="number"
                    numeral
                    value={editingProduct.artisanHours ?? 40}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        artisanHours: Number(e.target.value),
                        artisanHoursLabel: `${e.target.value} Hours Handcrafted`,
                      })
                    }
                  />
                </Field>
                <Field
                  label={
                    editingProduct.collectionId ? "Stock (locked 1-of-1)" : "Stock quantity"
                  }
                >
                  <Input
                    type="number"
                    min={0}
                    numeral
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
                  />
                </Field>
                <Field
                  label={
                    editingProduct.collectionId
                      ? "Acquired by collector"
                      : "Low-stock threshold"
                  }
                  className="sm:col-span-2"
                >
                  {editingProduct.collectionId ? (
                    <Input
                      value={editingProduct.acquiredBy || ""}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, acquiredBy: e.target.value })
                      }
                      placeholder="Collector name (inscribed when delivered)"
                    />
                  ) : (
                    <Input
                      type="number"
                      min={1}
                      numeral
                      value={editingProduct.lowStockThreshold ?? 2}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          lowStockThreshold: Number(e.target.value),
                        })
                      }
                    />
                  )}
                </Field>
              </div>
            </section>

            {/* Section 3: Media (Drag & Drop + Reorder + Cover + Alt Text) */}
            <section className="space-y-3 pt-4 border-t border-a-border">
              <h3 className="text-[12px] uppercase tracking-[0.04em] font-semibold text-a-text-3">
                Media
              </h3>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverZone(true);
                }}
                onDragLeave={() => setDragOverZone(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverZone(false);
                  if (e.dataTransfer.files?.length) {
                    uploadFiles(e.dataTransfer.files);
                  }
                }}
                className={`p-5 rounded-[10px] border border-dashed text-center transition-colors ${
                  dragOverZone
                    ? "border-a-accent bg-a-accent-soft"
                    : errors.image
                    ? "border-a-danger bg-a-danger-bg"
                    : "border-a-border-strong bg-a-subtle"
                }`}
              >
                <ImageIcon className="w-5 h-5 text-a-text-3 mx-auto mb-1.5" />
                <p className="text-[13px] font-medium text-a-text-1">
                  Drag and drop studio photographs here
                </p>
                <p className="text-[12px] text-a-text-3 mt-0.5">
                  PNG, JPG, or WebP · Drag thumbnails below to reorder
                </p>
                <label className="admin-press mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-a-surface hover:bg-a-subtle border border-a-border-strong text-[12px] font-medium text-a-text-1 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-a-accent" />
                  <span>{uploadingImg ? "Uploading…" : "Browse files"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files && uploadFiles(e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>

              {errors.image && (
                <p className="text-[12px] text-a-danger font-medium">{errors.image}</p>
              )}

              {galleryList.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {galleryList.map((imgUrl, idx) => {
                    const isCover = (editingProduct.image || galleryList[0]) === imgUrl;
                    return (
                      <div
                        key={`${imgUrl}-${idx}`}
                        draggable
                        onDragStart={() => setDragIdx(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (dragIdx === null || dragIdx === idx) return;
                          const next = [...galleryList];
                          const [moved] = next.splice(dragIdx, 1);
                          next.splice(idx, 0, moved);
                          setEditingProduct({
                            ...editingProduct,
                            gallery: next,
                            image: next[0],
                          });
                          setDragIdx(null);
                        }}
                        className={`group relative rounded-[8px] overflow-hidden border bg-a-subtle aspect-[4/5] ${
                          isCover ? "border-a-accent ring-1 ring-a-accent" : "border-a-border"
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={altTextDraft || editingProduct.name || "Piece preview"}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between">
                          <span className="p-1 rounded bg-a-surface/85 text-a-text-2 cursor-grab">
                            <GripVertical className="w-3 h-3" />
                          </span>
                          <button
                            type="button"
                            aria-label="Remove image"
                            onClick={() => {
                              const next = galleryList.filter((u) => u !== imgUrl);
                              setEditingProduct({
                                ...editingProduct,
                                gallery: next,
                                image: isCover ? next[0] || "" : editingProduct.image,
                              });
                            }}
                            className="p-1 rounded bg-a-surface/85 text-a-danger hover:bg-a-surface cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="absolute bottom-1.5 inset-x-1.5">
                          {isCover ? (
                            <span className="w-full inline-flex items-center justify-center gap-1 py-0.5 rounded bg-a-ink-btn/90 text-a-on-ink text-[12px] font-medium">
                              <Star className="w-3 h-3 text-a-accent" /> Cover
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingProduct({
                                  ...editingProduct,
                                  image: imgUrl,
                                })
                              }
                              className="w-full py-0.5 rounded bg-a-surface/90 text-a-text-1 text-[12px] font-medium hover:bg-a-surface cursor-pointer"
                            >
                              Set cover
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Cover image URL">
                  <Input
                    value={editingProduct.image || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingProduct({
                        ...editingProduct,
                        image: val,
                        gallery: val
                          ? [val, ...galleryList.filter((g) => g !== val)]
                          : galleryList,
                      });
                    }}
                    placeholder="/images/light-jamdani-pendant.png"
                  />
                </Field>
                <Field label="Image alt text">
                  <Input
                    value={altTextDraft}
                    onChange={(e) => setAltTextDraft(e.target.value)}
                    placeholder="Descriptive alt text for accessibility"
                  />
                </Field>
              </div>
            </section>

            {/* Section 4: Story & Craft */}
            <section className="space-y-3 pt-4 border-t border-a-border">
              <h3 className="text-[12px] uppercase tracking-[0.04em] font-semibold text-a-text-3">
                Story &amp; Craft
              </h3>
              <Field label="Piece story">
                <Textarea
                  rows={3}
                  value={editingProduct.story || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, story: e.target.value })}
                  placeholder="Tell the story of the craft, region, and stitch…"
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Materials">
                  <Input
                    value={editingProduct.materials || ""}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, materials: e.target.value })
                    }
                    placeholder="e.g. Handloom kora cotton, natural madder"
                  />
                </Field>
                <Field label="Dimensions">
                  <Input
                    numeral
                    value={editingProduct.dimensions || ""}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, dimensions: e.target.value })
                    }
                    placeholder="e.g. 210 × 150 cm"
                  />
                </Field>
                <Field label="Care instructions" className="sm:col-span-2">
                  <Input
                    value={editingProduct.care || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, care: e.target.value })}
                    placeholder="Gentle dry clean or airing in morning shade"
                  />
                </Field>
              </div>
            </section>

            {/* Section 5: Visibility */}
            <section className="space-y-3 pt-4 border-t border-a-border">
              <h3 className="text-[12px] uppercase tracking-[0.04em] font-semibold text-a-text-3">
                Visibility
              </h3>
              <Field label="Storefront availability status">
                <Select
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
                >
                  <option value="ready">
                    {editingProduct.collectionId
                      ? "Available (1 of 1 in Drop)"
                      : "In Stock (Ready to ship)"}
                  </option>
                  {!editingProduct.collectionId && (
                    <option value="limited">Low Stock Alert</option>
                  )}
                  <option value="waitlist">Pre-Booking / Waitlist</option>
                  <option value="sold">
                    {editingProduct.collectionId
                      ? "Acquired (1-of-1 Collector Archive)"
                      : "Sold Out (0 in stock)"}
                  </option>
                  <option value="hidden">Hidden (Draft)</option>
                </Select>
              </Field>
            </section>
          </div>
        )}
      </Drawer>

      {/* Mark Sold / Acquired Dialog (replaces window.prompt) */}
      <ConfirmDialog
        open={Boolean(soldTarget)}
        title={
          soldTarget?.collectionId
            ? `Mark "${soldTarget.name}" as Acquired?`
            : `Mark "${soldTarget?.name}" as Sold Out?`
        }
        description={
          soldTarget?.collectionId
            ? "This sets stock to 0 and inscribes this 1-of-1 piece in the collector archive."
            : "This sets available stock quantity to 0 on the storefront."
        }
        confirmLabel={soldTarget?.collectionId ? "Mark Acquired" : "Mark Sold Out"}
        loading={dialogBusy}
        inputLabel={
          soldTarget?.collectionId ? "Collector name (optional)" : undefined
        }
        inputPlaceholder="e.g. Farhana Chowdhury"
        initialInputValue={soldTarget?.acquiredBy || ""}
        onCancel={() => setSoldTarget(null)}
        onConfirm={async (collectorName) => {
          if (!soldTarget) return;
          const isDrop = Boolean(soldTarget.collectionId);
          setDialogBusy(true);
          await postAction(
            {
              action: "save_product",
              product: {
                ...soldTarget,
                status: "sold",
                statusLabel: isDrop ? "Acquired" : "Sold Out",
                stockQty: 0,
                acquiredBy: isDrop ? collectorName : soldTarget.acquiredBy,
              },
            },
            isDrop
              ? `Marked "${soldTarget.name}" as Acquired`
              : `Marked "${soldTarget.name}" as Sold Out`
          );
          setDialogBusy(false);
          setSoldTarget(null);
        }}
      />

      {/* Delete Product Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget ? `Delete "${deleteTarget.name}"?` : "Delete piece?"}
        description={
          deleteTarget
            ? `This permanently removes "${deleteTarget.name}" (${deleteTarget.sku}) from your studio catalog.`
            : ""
        }
        confirmLabel="Delete piece"
        danger
        loading={dialogBusy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDialogBusy(true);
          const deletedId = deleteTarget.id;
          await postAction(
            { action: "delete_product", id: deletedId },
            `Deleted "${deleteTarget.name}"`
          );
          setDialogBusy(false);
          setDeleteTarget(null);
          if (editingProduct?.id === deletedId) closeEditor();
        }}
      />
    </div>
  );
}
