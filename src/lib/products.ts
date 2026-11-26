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
