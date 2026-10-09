"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireMember, requireUser } from "@/lib/guard";
import { slugError, slugify } from "@/lib/slug";
import { PRESET_CATEGORIES, samplesFor } from "@/lib/catalog";
import { getTheme } from "@/lib/themes";
import { rupeesToPaise } from "@/lib/money";
import {
  applyMapping,
  evaluateRows,
  suggestMapping,
  type ImportField,
} from "@/lib/import-sheet";
import { parseWorkbook } from "@/lib/workbook";

export type LaunchInput = {
  name: string;
  slug: string;
  tagline: string;
  businessType: string;
  phone: string;
  email: string;
  whatsapp: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  logoData: string;
  categories: { name: string; custom: boolean }[];
  themeId: string;
  productMode: "dummy" | "sheet" | "later";
  sheet?: {
    headers: string[];
    raw: string[][];
    mapping: Partial<Record<ImportField, string | null>>;
    createMissingCategories: boolean;
  };
};

function presetSlugsFor(names: string[]) {
  const slugs: string[] = [];
  for (const name of names) {
    const preset = PRESET_CATEGORIES.find((item) => item.name.toLowerCase() === name.toLowerCase());
    if (preset) slugs.push(preset.slug);
  }
  return slugs;
}

function uniqueSlug(base: string, taken: Set<string>) {
  let slug = base || "store";
  if (!taken.has(slug) && !slugError(slug)) return slug;
  for (let i = 2; i < 1000; i += 1) {
    const next = `${base}-${i}`.slice(0, 40).replace(/-+$/g, "");
    if (!taken.has(next) && !slugError(next)) return next;
  }
  return `${base}-${Date.now().toString().slice(-4)}`;
}

export async function slugAvailable(slug: string) {
  const error = slugError(slug);
  if (error) return { ok: false, error };
  const existing = await prisma.store.findUnique({ where: { slug } });
  if (existing) return { ok: false, error: "That store address is already taken." };
  return { ok: true, error: null };
}

export async function launchStore(input: LaunchInput) {
  const user = await requireUser();
  const name = input.name.trim();
  if (name.length < 2) return { error: "Enter a store name." };
  if (!input.businessType) return { error: "Choose a business type." };
  if (!/^\d{10}$/.test(input.phone.replace(/\s/g, "").replace(/^\+91/, ""))) {
    return { error: "Enter a 10-digit phone number." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return { error: "Enter a contact email." };
  if (input.addressLine.trim().length < 4) return { error: "Enter the street address." };
  if (input.city.trim().length < 2) return { error: "Enter the city." };
  if (!/^\d{6}$/.test(input.pincode.trim())) return { error: "Enter a 6-digit PIN code." };
  if (!input.categories.length) return { error: "Pick at least one category." };
  if (input.logoData && input.logoData.length > 450_000) return { error: "Logo must be under 300 KB." };

  const stores = await prisma.store.findMany({ select: { slug: true } });
  const taken = new Set(stores.map((store) => store.slug));
  const wanted = slugify(input.slug || name);
  const slugIssue = slugError(wanted);
  const slug = slugIssue || taken.has(wanted) ? uniqueSlug(slugify(name) || "store", taken) : wanted;
  const theme = getTheme(input.themeId);

  const categoryRows = input.categories.map((category) => {
    const preset = PRESET_CATEGORIES.find((item) => item.name.toLowerCase() === category.name.toLowerCase());
    return {
      name: category.name.trim(),
      slug: preset?.slug ?? slugify(category.name),
      source: category.custom ? "custom" : "preset",
    };
  });

  let sheetResult: ReturnType<typeof evaluateRows> | null = null;
  if (input.productMode === "sheet") {
    if (!input.sheet) return { error: "Upload a spreadsheet or choose another way to add products." };
    const mapped = applyMapping(input.sheet.headers, input.sheet.raw, input.sheet.mapping);
    sheetResult = evaluateRows(mapped, {
      existingSkus: [],
      knownCategories: categoryRows.map((category) => category.name),
      createMissingCategories: input.sheet.createMissingCategories,
    });
    if (!sheetResult.valid.length) {
      return { error: "No valid product rows to import. Fix the sheet or fill the store with samples." };
    }
    for (const product of sheetResult.valid.filter((item) => item.createCategory)) {
      if (!categoryRows.some((category) => category.name.toLowerCase() === product.category.toLowerCase())) {
        categoryRows.push({ name: product.category, slug: slugify(product.category), source: "custom" });
      }
    }
  }

  const store = await prisma.store.create({
    data: {
      slug,
      name,
      tagline: input.tagline.trim(),
      businessType: input.businessType,
      logoData: input.logoData,
      phone: input.phone.trim(),
      email: input.email.trim(),
      whatsapp: input.whatsapp.trim() || input.phone.trim(),
      addressLine: input.addressLine.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
      pincode: input.pincode.trim(),
      themeId: theme.id,
      bannerTitle: input.tagline.trim() || `Welcome to ${name}`,
      bannerSubtitle: `${input.businessType} in ${input.city.trim()}`,
      aboutText: `${name} is a ${input.businessType.toLowerCase()} business based in ${input.city.trim()}.`,
      footerNote: `${input.addressLine.trim()}, ${input.city.trim()} ${input.pincode.trim()}`,
      announcement: "Orders placed here are confirmed by the store.",
      members: { create: { userId: user.id, role: "OWNER" } },
      categories: { create: categoryRows },
      sections: {
        create: [
          { kind: "hero", title: input.tagline.trim() || name, body: `${input.businessType} · ${input.city.trim()}`, sort: 0 },
          { kind: "featured", title: "Just in", body: "A few things people ask for first.", sort: 1 },
          { kind: "categories", title: "Shop by category", body: "", sort: 2 },
          { kind: "about", title: `About ${name}`, body: `${name} sells online from ${input.city.trim()}.`, sort: 3 },
        ],
      },
      activities: { create: { message: "Store launched." } },
    },
    include: { categories: true },
  });

  if (input.productMode === "dummy") {
    const presetSlugs = presetSlugsFor(store.categories.map((category) => category.name));
    const samples = samplesFor(presetSlugs);
    for (const sample of samples) {
      const category = store.categories.find((item) =>
        PRESET_CATEGORIES.some((preset) => preset.slug === sample.categorySlug && preset.name === item.name),
      );
      await prisma.product.create({
        data: {
          storeId: store.id,
          categoryId: category?.id,
          name: sample.name,
          slug: slugify(sample.name),
          description: sample.description,
          pricePaise: rupeesToPaise(sample.price),
          compareAtPaise: sample.compareAt ? rupeesToPaise(sample.compareAt) : null,
          sku: sample.sku,
          stock: sample.variants?.reduce((sum, variant) => sum + variant.stock, 0) ?? sample.stock,
          imageUrl: sample.imageUrl,
          discountPercent: sample.discountPercent ?? 0,
          variants: sample.variants
            ? { create: sample.variants.map((variant) => ({ name: variant.name, stock: variant.stock })) }
            : undefined,
        },
      });
    }
    await prisma.activity.create({
      data: { storeId: store.id, message: `Added ${samples.length} sample products.` },
    });
  }

  if (sheetResult) {
    await writeImportedProducts(store.id, sheetResult.valid);
  }

  redirect(`/s/${store.slug}?welcome=1`);
}

export async function writeImportedProducts(
  storeId: string,
  products: ReturnType<typeof evaluateRows>["valid"],
) {
  const categories = await prisma.category.findMany({ where: { storeId } });
  const byName = new Map(categories.map((category) => [category.name.toLowerCase(), category]));
  for (const product of products) {
    let category = byName.get(product.category.toLowerCase());
    if (!category && product.createCategory) {
      category = await prisma.category.create({
        data: { storeId, name: product.category, slug: slugify(product.category) || `cat-${Date.now()}`, source: "custom" },
      });
      byName.set(product.category.toLowerCase(), category);
    }
    const base = slugify(product.name) || "product";
    let slug = base;
    let n = 2;
    while (await prisma.product.findUnique({ where: { storeId_slug: { storeId, slug } } })) {
      slug = `${base}-${n++}`;
    }
    await prisma.product.create({
      data: {
        storeId,
        categoryId: category?.id,
        name: product.name,
        slug,
        description: product.description,
        pricePaise: rupeesToPaise(product.priceRupees),
        compareAtPaise: product.compareAtRupees ? rupeesToPaise(product.compareAtRupees) : null,
        sku: product.sku,
        stock: product.stock,
        imageUrl: product.imageUrl,
        discountPercent: product.discountPercent,
      },
    });
  }
  await prisma.activity.create({
    data: { storeId, message: `Imported ${products.length} products from a spreadsheet.` },
  });
}

export async function parseUpload(formData: FormData) {
  await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Choose a CSV or Excel file." };
  const name = file.name.toLowerCase();
  if (!name.endsWith(".csv") && !name.endsWith(".xlsx") && !name.endsWith(".xls")) {
    return { error: "Upload a .csv, .xlsx, or .xls file." };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseWorkbook(buffer);
  if ("error" in parsed) return { error: parsed.error };
  return { headers: parsed.headers, raw: parsed.raw, mapping: suggestMapping(parsed.headers) };
}

export async function checkMappedRows(input: {
  storeId?: string;
  headers: string[];
  raw: string[][];
  mapping: Partial<Record<ImportField, string | null>>;
  knownCategories: string[];
  createMissingCategories: boolean;
}) {
  await requireUser();
  if (!input.mapping.name || !input.mapping.price || !input.mapping.category) {
    return { error: "Map the name, price, and category columns before checking rows." };
  }
  let existingSkus: string[] = [];
  if (input.storeId) {
    await requireMember(input.storeId);
    const products = await prisma.product.findMany({ where: { storeId: input.storeId }, select: { sku: true } });
    existingSkus = products.map((product) => product.sku);
  }
  const rows = applyMapping(input.headers, input.raw, input.mapping);
  const result = evaluateRows(rows, {
    existingSkus,
    knownCategories: input.knownCategories,
    createMissingCategories: input.createMissingCategories,
  });
  return {
    validCount: result.valid.length,
    errors: result.errors,
    preview: result.valid.slice(0, 8).map((product) => ({
      row: product.rowNumber,
      name: product.name,
      category: product.category,
      price: product.priceRupees,
      stock: product.stock,
      sku: product.sku,
    })),
  };
}

export async function importIntoStore(input: {
  storeId: string;
  headers: string[];
  raw: string[][];
  mapping: Partial<Record<ImportField, string | null>>;
  createMissingCategories: boolean;
}) {
  const member = await requireMember(input.storeId);
  if (!input.mapping.name || !input.mapping.price || !input.mapping.category) {
    return { error: "Map the name, price, and category columns." };
  }
  const categories = await prisma.category.findMany({ where: { storeId: input.storeId } });
  const products = await prisma.product.findMany({ where: { storeId: input.storeId }, select: { sku: true } });
  const rows = applyMapping(input.headers, input.raw, input.mapping);
  const result = evaluateRows(rows, {
    existingSkus: products.map((product) => product.sku),
    knownCategories: categories.map((category) => category.name),
    createMissingCategories: input.createMissingCategories,
  });
  if (!result.valid.length) return { error: "No valid rows to import.", errors: result.errors, imported: 0 };
  await writeImportedProducts(member.storeId, result.valid);
  return { imported: result.valid.length, errors: result.errors };
}

export async function seedSamples(storeId: string) {
  const member = await requireMember(storeId);
  const categories = await prisma.category.findMany({ where: { storeId } });
  const presetSlugs = presetSlugsFor(categories.map((category) => category.name));
  if (!presetSlugs.length) {
    return { error: "Sample products exist for the built-in categories. Add one of those, or upload a sheet." };
  }
  const existing = await prisma.product.findMany({ where: { storeId }, select: { sku: true, slug: true } });
  const skus = new Set(existing.map((product) => product.sku));
  const slugs = new Set(existing.map((product) => product.slug));
  let added = 0;
  for (const sample of samplesFor(presetSlugs)) {
    if (skus.has(sample.sku)) continue;
    const category = categories.find((item) =>
      PRESET_CATEGORIES.some((preset) => preset.slug === sample.categorySlug && preset.name === item.name),
    );
    let slug = slugify(sample.name);
    while (slugs.has(slug)) slug = `${slug}-2`;
    await prisma.product.create({
      data: {
        storeId,
        categoryId: category?.id,
        name: sample.name,
        slug,
        description: sample.description,
        pricePaise: rupeesToPaise(sample.price),
        compareAtPaise: sample.compareAt ? rupeesToPaise(sample.compareAt) : null,
        sku: sample.sku,
        stock: sample.variants?.reduce((sum, variant) => sum + variant.stock, 0) ?? sample.stock,
        imageUrl: sample.imageUrl,
        discountPercent: sample.discountPercent ?? 0,
        variants: sample.variants
          ? { create: sample.variants.map((variant) => ({ name: variant.name, stock: variant.stock })) }
          : undefined,
      },
    });
    slugs.add(slug);
    added += 1;
  }
  await prisma.activity.create({ data: { storeId: member.storeId, message: `Added ${added} sample products.` } });
  return { added };
}
