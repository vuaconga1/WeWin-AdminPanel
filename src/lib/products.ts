export const PRODUCT_IDS = [
  "ielts",
  "cambridge",
  "exam",
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

const DEFAULT_PUBLIC_ORIGINS: Partial<Record<ProductId, string>> = {
  ielts: "https://ielts.wewin.edu.vn",
  cambridge: "https://cambridge-placement-test.vercel.app",
  exam: "https://exam.wewin.edu.vn",
  toeic: "https://toeic.wewin.edu.vn",
  vstep: "https://vstep.wewin.edu.vn",
  dailytalk: "https://dailytalk.wewin.edu.vn",
  chinese: "https://chinese.wewin.edu.vn",
};

function envPublicOrigin(id: ProductId): string | null {
  const map: Record<ProductId, string | undefined> = {
    ielts:
      process.env.IELTS_PUBLIC_SITE_URL?.trim() ||
      process.env.NEXT_PUBLIC_IELTS_SITE_URL?.trim(),
    cambridge: process.env.CAMBRIDGE_PUBLIC_SITE_URL?.trim(),
    exam: process.env.EXAM_PUBLIC_SITE_URL?.trim(),
    toeic: process.env.TOEIC_PUBLIC_SITE_URL?.trim(),
    vstep: process.env.VSTEP_PUBLIC_SITE_URL?.trim(),
    dailytalk: process.env.DAILYTALK_PUBLIC_SITE_URL?.trim(),
    chinese: process.env.CHINESE_PUBLIC_SITE_URL?.trim(),
  };
  return map[id] || null;
}

function normalizeOrigin(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Browser origin for the product site (embed SSO consume + admin landing).
 */
export function getProductPublicSiteUrl(id: ProductId): string | null {
  const fromEnv = envPublicOrigin(id);
  if (fromEnv) return normalizeOrigin(fromEnv);
  const fallback = DEFAULT_PUBLIC_ORIGINS[id];
  return fallback ? normalizeOrigin(fallback) : null;
}

/**
 * Admin area path on the product origin (after embed-sso-consume).
 */
export function getProductAdminPath(id: ProductId): string {
  switch (id) {
    case "exam":
      return "/?screen=staff";
    case "toeic":
      return "/manage/toeic";
    case "vstep":
      return "/manage/vstep";
    case "ielts":
    case "cambridge":
    case "dailytalk":
    case "chinese":
    default:
      return "/admin";
  }
}

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
      descriptionVi: "Kết quả placement Cambridge trên cambridge-placement-test.vercel.app",
      descriptionEn: "Cambridge placement results from cambridge-placement-test.vercel.app",
      href: "/p/cambridge",
    },
    {
      id: "exam",
      nameVi: "Exam",
      nameEn: "Exam",
      descriptionVi: "Lịch sử luyện thi Cambridge trên exam.wewin.edu.vn",
      descriptionEn: "Cambridge practice history from exam.wewin.edu.vn",
      href: "/p/exam",
    },
    {
      id: "toeic",
      nameVi: "TOEIC",
      nameEn: "TOEIC",
      descriptionVi: "Lịch sử làm bài TOEIC trên toeic.wewin.edu.vn",
      descriptionEn: "TOEIC attempt history from toeic.wewin.edu.vn",
      href: "/p/toeic",
    },
    {
      id: "vstep",
      nameVi: "VSTEP",
      nameEn: "VSTEP",
      descriptionVi: "Lịch sử làm bài VSTEP trên vstep.wewin.edu.vn",
      descriptionEn: "VSTEP attempt history from vstep.wewin.edu.vn",
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
