export function formatINR(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export function rupeesToPaise(rupees: number) {
  return Math.round(rupees * 100);
}

export function sellingPaise(pricePaise: number, discountPercent: number) {
  const discount = Math.min(90, Math.max(0, discountPercent || 0));
  return Math.round((pricePaise * (100 - discount)) / 100);
}

export function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
