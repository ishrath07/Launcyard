export const BUSINESS_TYPES = [
  "Retail",
  "Restaurant / Cafe",
  "Grocery",
  "Handmade",
  "Wholesale",
  "Services",
  "Other",
] as const;

export const PRESET_CATEGORIES = [
  { slug: "fashion", name: "Fashion" },
  { slug: "electronics", name: "Electronics" },
  { slug: "home-kitchen", name: "Home & Kitchen" },
  { slug: "beauty", name: "Beauty" },
  { slug: "grocery", name: "Grocery" },
  { slug: "sports", name: "Sports" },
  { slug: "jewelry", name: "Jewelry" },
  { slug: "food-beverage", name: "Food & Beverage" },
] as const;

export type SampleProduct = {
  name: string;
  description: string;
  price: number;
  compareAt?: number;
  sku: string;
  stock: number;
  imageUrl: string;
  discountPercent?: number;
  variants?: { name: string; stock: number; price?: number }[];
};

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

export const SAMPLE_PRODUCTS: Record<string, SampleProduct[]> = {
  fashion: [
    {
      name: "Handloom Cotton Kurta",
      description: "Breathable handloom cotton kurta with a straight cut, made for warm afternoons.",
      price: 1899,
      compareAt: 2499,
      sku: "FAS-KURTA",
      stock: 24,
      discountPercent: 10,
      imageUrl: img("photo-1594938298603-c8148c4dae35"),
      variants: [
        { name: "S", stock: 6 },
        { name: "M", stock: 10 },
        { name: "L", stock: 8 },
      ],
    },
    {
      name: "Everyday Linen Shirt",
      description: "Stone-washed linen shirt that softens with every wash.",
      price: 2199,
      sku: "FAS-LINEN",
      stock: 16,
      imageUrl: img("photo-1596755094514-f87e34085b2c"),
    },
    {
      name: "Canvas Court Sneakers",
      description: "Low canvas sneakers with a cushioned insole for all-day wear.",
      price: 2799,
      sku: "FAS-SNEAK",
      stock: 12,
      imageUrl: img("photo-1549298916-b41d501d3772"),
    },
  ],
  electronics: [
    {
      name: "Wireless Earbuds",
      description: "Compact earbuds with a charging case and 24 hours of play time.",
      price: 2499,
      compareAt: 3499,
      sku: "ELC-BUDS",
      stock: 30,
      imageUrl: img("photo-1590658268037-6bf12165a8df"),
    },
    {
      name: "Desk LED Lamp",
      description: "Dimmable LED lamp with a warm and cool mode for late work.",
      price: 1599,
      sku: "ELC-LAMP",
      stock: 18,
      imageUrl: img("photo-1507473885765-e6ed057f782c"),
    },
    {
      name: "Portable Bluetooth Speaker",
      description: "Small speaker with a fabric grille, loud enough for a shop counter.",
      price: 1999,
      sku: "ELC-SPKR",
      stock: 4,
      imageUrl: img("photo-1608043152269-423dbba4e7e1"),
    },
  ],
  "home-kitchen": [
    {
      name: "Stoneware Dinner Set",
      description: "Twelve-piece stoneware set in a matte sand glaze.",
      price: 3299,
      sku: "HOM-DINE",
      stock: 9,
      imageUrl: img("photo-1610701596007-11502861dcfa"),
    },
    {
      name: "Cotton Throw Blanket",
      description: "Washed cotton throw, light enough for evenings on the sofa.",
      price: 1499,
      sku: "HOM-THROW",
      stock: 14,
      imageUrl: img("photo-1584100936595-c0654b55a2e2"),
    },
    {
      name: "Cast Iron Skillet",
      description: "10-inch pre-seasoned skillet for everyday cooking.",
      price: 1890,
      sku: "HOM-PAN",
      stock: 7,
      imageUrl: img("photo-1574180566232-aaad1b5b8450"),
    },
  ],
  beauty: [
    {
      name: "Cold-Pressed Hair Oil",
      description: "Coconut and curry-leaf oil in a 200 ml glass bottle.",
      price: 649,
      sku: "BTY-OIL",
      stock: 40,
      imageUrl: img("photo-1608571423902-eed4a5ad8108"),
    },
    {
      name: "Clay Face Mask",
      description: "Multani mitti mask for a weekly reset. 100 g jar.",
      price: 499,
      sku: "BTY-MASK",
      stock: 22,
      imageUrl: img("photo-1556228720-195a672e8a03"),
    },
    {
      name: "Rosewater Mist",
      description: "Steam-distilled rosewater in a fine-mist bottle.",
      price: 399,
      sku: "BTY-ROSE",
      stock: 3,
      imageUrl: img("photo-1596462502278-27bfdc403348"),
    },
  ],
  grocery: [
    {
      name: "Toor Dal, 1 kg",
      description: "Unpolished toor dal, packed the week it is milled.",
      price: 189,
      sku: "GRO-DAL",
      stock: 50,
      imageUrl: img("photo-1615485290382-441e4d049cb5"),
    },
    {
      name: "Cold-Pressed Groundnut Oil",
      description: "1 litre tin of wood-pressed groundnut oil.",
      price: 420,
      sku: "GRO-OIL",
      stock: 20,
      imageUrl: img("photo-1474979266404-7eaacbcd87c5"),
    },
    {
      name: "Filter Coffee Powder",
      description: "80:20 coffee and chicory blend, 250 g.",
      price: 275,
      sku: "GRO-COFF",
      stock: 2,
      imageUrl: img("photo-1447933601403-0c6688de566e"),
    },
  ],
  sports: [
    {
      name: "Yoga Mat",
      description: "6 mm non-slip mat with a carry strap.",
      price: 1299,
      sku: "SPT-MAT",
      stock: 15,
      imageUrl: img("photo-1601925260368-ae2f83cf8b7f"),
    },
    {
      name: "Steel Water Bottle",
      description: "750 ml insulated bottle that stays cold for a day.",
      price: 899,
      sku: "SPT-BOTTLE",
      stock: 28,
      imageUrl: img("photo-1602143407151-011e6a3b0c4e"),
    },
    {
      name: "Skipping Rope",
      description: "Adjustable ball-bearing rope for home workouts.",
      price: 449,
      sku: "SPT-ROPE",
      stock: 6,
      imageUrl: img("photo-1517836357463-d25dfeac3438"),
    },
  ],
  jewelry: [
    {
      name: "Silver Stud Earrings",
      description: "Small sterling-style studs for everyday wear.",
      price: 999,
      sku: "JWL-STUD",
      stock: 11,
      imageUrl: img("photo-1535632066927-ab7c9ab60908"),
    },
    {
      name: "Beaded Bracelet",
      description: "Hand-strung wooden bead bracelet.",
      price: 649,
      sku: "JWL-BEAD",
      stock: 19,
      imageUrl: img("photo-1611652022419-a9419f74343d"),
    },
    {
      name: "Gold-Tone Hoops",
      description: "Lightweight hoops with a polished finish.",
      price: 799,
      sku: "JWL-HOOP",
      stock: 1,
      imageUrl: img("photo-1630019852942-f89202989a59"),
    },
  ],
  "food-beverage": [
    {
      name: "Masala Chai Blend",
      description: "Assam tea with ginger, cardamom, and black pepper. 200 g.",
      price: 320,
      sku: "FNB-CHAI",
      stock: 35,
      imageUrl: img("photo-1564890369478-c89ca6d9cde9"),
    },
    {
      name: "Jaggery Cookies",
      description: "A box of twelve jaggery and sesame cookies.",
      price: 240,
      sku: "FNB-COOK",
      stock: 16,
      imageUrl: img("photo-1499636136210-6f4ee915583e"),
    },
    {
      name: "Mango Pickle, 400 g",
      description: "Avakaya-style mango pickle in a glass jar.",
      price: 280,
      sku: "FNB-PICK",
      stock: 5,
      imageUrl: img("photo-1598515214211-89d3c73ae83b"),
    },
  ],
};

export function samplesFor(categorySlugs: string[]) {
  return categorySlugs.flatMap((slug) =>
    (SAMPLE_PRODUCTS[slug] ?? []).map((product) => ({ ...product, categorySlug: slug })),
  );
}
