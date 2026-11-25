export const PRODUCT_IDS = [
  "ielts",
  "cambridge",
  "toeic",
  "vstep",
  "dailytalk",
  "chinese",
] as const;

export type ProductId = (typeof PRODUCT_IDS)[number];

export type ProductLink = {
  id: ProductId;
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  descriptionEn: string;
  /** In-app admin path (placement list for this product). */
  href: string;
};

/** Product admin pages in the sidebar (in-app, not external). */
export function listProducts(): ProductLink[] {
  return [
    {
      id: "ielts",
      nameVi: "IELTS",
      nameEn: "IELTS",
      descriptionVi: "Placement IELTS trong AdminPanel",
      descriptionEn: "IELTS placement in AdminPanel",
      href: "/p/ielts",
    },
    {
      id: "cambridge",
      nameVi: "Cambridge Placement",
      nameEn: "Cambridge Placement",
      descriptionVi: "Placement Cambridge trong AdminPanel",
      descriptionEn: "Cambridge placement in AdminPanel",
      href: "/p/cambridge",
    },
    {
      id: "toeic",
      nameVi: "TOEIC",
      nameEn: "TOEIC",
      descriptionVi: "Placement TOEIC trong AdminPanel",
      descriptionEn: "TOEIC placement in AdminPanel",
      href: "/p/toeic",
    },
    {
      id: "vstep",
      nameVi: "VSTEP",
      nameEn: "VSTEP",
      descriptionVi: "Placement VSTEP trong AdminPanel",
      descriptionEn: "VSTEP placement in AdminPanel",
      href: "/p/vstep",
    },
    {
      id: "dailytalk",
      nameVi: "DailyTalk",
      nameEn: "DailyTalk",
      descriptionVi: "Placement DailyTalk trong AdminPanel",
      descriptionEn: "DailyTalk placement in AdminPanel",
      href: "/p/dailytalk",
    },
    {
      id: "chinese",
      nameVi: "Chinese",
      nameEn: "Chinese",
      descriptionVi: "Placement Chinese trong AdminPanel",
      descriptionEn: "Chinese placement in AdminPanel",
      href: "/p/chinese",
    },
  ];
}

export function getProduct(id: string): ProductLink | null {
  return listProducts().find((p) => p.id === id) ?? null;
}

export function isProductId(id: string): id is ProductId {
  return (PRODUCT_IDS as readonly string[]).includes(id);
}
