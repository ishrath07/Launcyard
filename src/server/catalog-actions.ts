"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/guard";
import { rupeesToPaise, sellingPaise } from "@/lib/money";
import { slugify } from "@/lib/slug";
import { getTheme } from "@/lib/themes";

async function touch(storeId: string, slug: string) {
  revalidatePath(`/admin/${storeId}`);
  revalidatePath(`/s/${slug}`);
}

export async function saveProduct(input: {
  storeId: string;
  productId?: string;
  name: string;
  categoryId: string;
  description: string;
  price: string;
  compareAt: string;
  sku: string;
  stock: string;
  imageUrl: string;
  discount: string;
  active: boolean;
  variants: { name: string; stock: string; price: string }[];
}) {
  const member = await requireMember(input.storeId);
  const name = input.name.trim();
  if (name.length < 2) return { error: "Enter a product name." };
  const price = Number(input.price);
  if (!Number.isFinite(price) || price <= 0) return { error: "Enter a price above 0." };
  const discount = Number(input.discount || 0);
  if (!Number.isInteger(discount) || discount < 0 || discount > 90) return { error: "Discount must be a whole number from 0 to 90." };
  const stock = Number(input.stock || 0);
  if (!Number.isInteger(stock) || stock < 0) return { error: "Stock must be a whole number, 0 or more." };
  const compare = input.compareAt ? Number(input.compareAt) : null;
  if (compare !== null && (!Number.isFinite(compare) || compare <= 0)) return { error: "Compare-at price is not valid." };

  const variants = input.variants
    .map((variant) => ({
      name: variant.name.trim(),
      stock: Number(variant.stock || 0),
      price: variant.price ? Number(variant.price) : null,
    }))
    .filter((variant) => variant.name);
  for (const variant of variants) {
    if (!Number.isInteger(variant.stock) || variant.stock < 0) return { error: `Stock for ${variant.name} is not valid.` };
    if (variant.price !== null && (!Number.isFinite(variant.price) || variant.price <= 0)) {
      return { error: `Price for ${variant.name} is not valid.` };
    }
  }
  const variantStock = variants.reduce((sum, variant) => sum + variant.stock, 0);

  const data = {
    name,
    categoryId: input.categoryId || null,
    description: input.description.trim(),
    pricePaise: rupeesToPaise(price),
    compareAtPaise: compare ? rupeesToPaise(compare) : null,
    sku: input.sku.trim(),
    stock: variants.length ? variantStock : stock,
    imageUrl: input.imageUrl.trim(),
    discountPercent: discount,
    active: input.active,
  };

  if (input.productId) {
    const existing = await prisma.product.findFirst({ where: { id: input.productId, storeId: input.storeId } });
    if (!existing) return { error: "That product is not in this store." };
    await prisma.variant.deleteMany({ where: { productId: existing.id } });
    await prisma.product.update({
      where: { id: existing.id },
      data: {
        ...data,
        variants: { create: variants.map((variant) => ({ name: variant.name, stock: variant.stock, pricePaise: variant.price ? rupeesToPaise(variant.price) : null })) },
      },
    });
  } else {
    const base = slugify(name) || "product";
    let slug = base;
    let n = 2;
    while (await prisma.product.findUnique({ where: { storeId_slug: { storeId: input.storeId, slug } } })) slug = `${base}-${n++}`;
    await prisma.product.create({
      data: {
        ...data,
        storeId: input.storeId,
        slug,
        variants: { create: variants.map((variant) => ({ name: variant.name, stock: variant.stock, pricePaise: variant.price ? rupeesToPaise(variant.price) : null })) },
      },
    });
  }
  await prisma.activity.create({ data: { storeId: input.storeId, message: `${input.productId ? "Updated" : "Added"} product ${name}.` } });
  await touch(input.storeId, member.store.slug);
  return { ok: true };
}

export async function deleteProduct(storeId: string, productId: string) {
  const member = await requireMember(storeId);
  if (member.role !== "OWNER") return { error: "Only the owner can delete products." };
  const product = await prisma.product.findFirst({ where: { id: productId, storeId } });
  if (!product) return { error: "That product is not in this store." };
  await prisma.product.delete({ where: { id: product.id } });
  await prisma.activity.create({ data: { storeId, message: `Deleted product ${product.name}.` } });
  await touch(storeId, member.store.slug);
  return { ok: true };
}

export async function bulkEditProducts(input: {
  storeId: string;
  ids: string[];
  discount?: string;
  stock?: string;
  active?: "keep" | "active" | "hidden";
}) {
  const member = await requireMember(input.storeId);
  if (!input.ids.length) return { error: "Select at least one product." };
  const data: { discountPercent?: number; stock?: number; active?: boolean } = {};
  if (input.discount !== undefined && input.discount !== "") {
    const discount = Number(input.discount);
    if (!Number.isInteger(discount) || discount < 0 || discount > 90) return { error: "Discount must be 0 to 90." };
    data.discountPercent = discount;
  }
  if (input.stock !== undefined && input.stock !== "") {
    const stock = Number(input.stock);
    if (!Number.isInteger(stock) || stock < 0) return { error: "Stock must be a whole number." };
    data.stock = stock;
  }
  if (input.active === "active") data.active = true;
  if (input.active === "hidden") data.active = false;
  if (!Object.keys(data).length) return { error: "Choose a stock, discount, or visibility change." };
  const result = await prisma.product.updateMany({ where: { storeId: input.storeId, id: { in: input.ids } }, data });
  await prisma.activity.create({ data: { storeId: input.storeId, message: `Bulk-edited ${result.count} products.` } });
  await touch(input.storeId, member.store.slug);
  return { ok: true, count: result.count };
}

export async function addCategory(storeId: string, name: string) {
  const member = await requireMember(storeId);
  const clean = name.trim();
  if (clean.length < 2) return { error: "Enter a category name." };
  const slug = slugify(clean);
  const exists = await prisma.category.findUnique({ where: { storeId_slug: { storeId, slug } } });
  if (exists) return { error: "That category already exists." };
  await prisma.category.create({ data: { storeId, name: clean, slug, source: "custom" } });
  await touch(storeId, member.store.slug);
  return { ok: true };
}

export async function saveContent(input: {
  storeId: string;
  logoData: string;
  announcement: string;
  bannerTitle: string;
  bannerSubtitle: string;
  aboutText: string;
  footerNote: string;
  phone: string;
  email: string;
  whatsapp: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  sections: { id: string; title: string; body: string; enabled: boolean }[];
}) {
  const member = await requireMember(input.storeId);
  if (member.role !== "OWNER") return { error: "Only the owner can edit store content." };
  if (input.logoData && input.logoData.length > 450_000) return { error: "Logo must be under 300 KB." };
  await prisma.store.update({
    where: { id: input.storeId },
    data: {
      logoData: input.logoData,
      announcement: input.announcement.trim(),
      bannerTitle: input.bannerTitle.trim(),
      bannerSubtitle: input.bannerSubtitle.trim(),
      aboutText: input.aboutText.trim(),
      footerNote: input.footerNote.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      whatsapp: input.whatsapp.trim(),
      addressLine: input.addressLine.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
      pincode: input.pincode.trim(),
    },
  });
  for (const section of input.sections) {
    await prisma.homepageSection.updateMany({
      where: { id: section.id, storeId: input.storeId },
      data: { title: section.title.trim(), body: section.body.trim(), enabled: section.enabled },
    });
  }
  await prisma.activity.create({ data: { storeId: input.storeId, message: "Updated storefront content." } });
  await touch(input.storeId, member.store.slug);
  return { ok: true };
}

export async function saveTheme(storeId: string, themeId: string) {
  const member = await requireMember(storeId);
  if (member.role !== "OWNER") return { error: "Only the owner can change the theme." };
  const theme = getTheme(themeId);
  await prisma.store.update({ where: { id: storeId }, data: { themeId: theme.id } });
  await prisma.activity.create({ data: { storeId, message: `Theme set to ${theme.name}.` } });
  await touch(storeId, member.store.slug);
  return { ok: true };
}

export async function addStaff(storeId: string, email: string) {
  const member = await requireMember(storeId);
  if (member.role !== "OWNER") return { error: "Only the owner can add staff." };
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return { error: "No account with that email. Ask them to sign up, then add them." };
  if (user.id === member.userId) return { error: "You are already the owner." };
  await prisma.storeMember.upsert({
    where: { storeId_userId: { storeId, userId: user.id } },
    update: { role: "STAFF" },
    create: { storeId, userId: user.id, role: "STAFF" },
  });
  await prisma.activity.create({ data: { storeId, message: `Added staff member ${user.email}.` } });
  return { ok: true };
}

export async function removeStaff(storeId: string, userId: string) {
  const member = await requireMember(storeId);
  if (member.role !== "OWNER") return { error: "Only the owner can remove staff." };
  const target = await prisma.storeMember.findUnique({ where: { storeId_userId: { storeId, userId } } });
  if (!target || target.role === "OWNER") return { error: "That member cannot be removed." };
  await prisma.storeMember.delete({ where: { id: target.id } });
  return { ok: true };
}

export { sellingPaise };
