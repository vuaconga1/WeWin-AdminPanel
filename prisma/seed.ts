import {
  PrismaClient,
  AdminRole,
  PlacementBranch,
  FastbotsChatStatus,
  Prisma,
} from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

function requireSeedPassword(): string {
  const pwd = process.env.ADMIN_SEED_PASSWORD?.trim();
  if (pwd && pwd.length >= 8) return pwd;
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SEED_PASSWORD (≥8 chars) is required in production");
  }
  return "Admin123!";
}

async function main() {
  const email = (
    process.env.ADMIN_SEED_EMAIL?.trim() || "admin@wewin.local"
  ).toLowerCase();
  const username =
    process.env.ADMIN_SEED_USERNAME?.trim() || email.split("@")[0] || "admin";
  const password = requireSeedPassword();
  const passwordHash = hashSync(password, 12);

  await prisma.adminUser.upsert({
    where: { email },
    update: {
      username,
      passwordHash,
      fullName: "WeWIN Admin",
      role: AdminRole.ADMIN,
    },
    create: {
      email,
      username,
      passwordHash,
      fullName: "WeWIN Admin",
      role: AdminRole.ADMIN,
    },
  });

  const samples = [
    {
      externalId: "PT-1TAO",
      studentName: "Quản Trị Viên",
      branch: PlacementBranch.NTL,
      testLabel: "IELTS Placement Test — Listening",
      testSlug: "ielts-placement-listening",
      finishedAt: new Date("2026-11-22T14:39:00.000Z"),
      scoreCorrect: 34,
      scoreTotal: 40,
      scorePercent: 85,
      detailUrl: "",
      source: "ielts",
    },
    {
      externalId: "PT-1TAP",
      studentName: "Quản Trị Viên",
      branch: PlacementBranch.NTL,
      testLabel: "IELTS Placement Test — Writing",
      testSlug: "ielts-placement-writing",
      finishedAt: new Date("2026-11-22T14:55:00.000Z"),
      scoreCorrect: 0,
      scoreTotal: 0,
      scorePercent: null as number | null,
      detailUrl: "",
      source: "ielts",
    },
    {
      externalId: "PT-1TAR",
      studentName: "Quản Trị Viên",
      branch: PlacementBranch.NTL,
      testLabel: "IELTS Placement Test — Reading",
      testSlug: "ielts-placement-reading",
      finishedAt: new Date("2026-11-22T13:20:00.000Z"),
      scoreCorrect: 21,
      scoreTotal: 40,
      scorePercent: 53,
      detailUrl: "",
      source: "ielts",
    },
    {
      externalId: "PT-2BXN",
      studentName: "Nguyễn Văn A",
      branch: PlacementBranch.XVNT,
      testLabel: "IELTS Placement Test — Listening",
      testSlug: "ielts-placement-listening",
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      scoreCorrect: 31,
      scoreTotal: 40,
      scorePercent: 77.5,
      detailUrl: "",
      source: "ielts",
    },
    {
      externalId: "PT-2BXO",
      studentName: "Trần Thị B",
      branch: PlacementBranch.XVNT,
      testLabel: "IELTS Placement Test — Reading",
      testSlug: "ielts-placement-reading",
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
      scoreCorrect: 10,
      scoreTotal: 19,
      scorePercent: 53,
      detailUrl: "",
      source: "ielts",
    },
    {
      externalId: "PT-3NTL",
      studentName: "Lê Minh C",
      branch: PlacementBranch.NTL,
      testLabel: "IELTS Placement Test — Listening",
      testSlug: "ielts-placement-listening",
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
      scoreCorrect: 28,
      scoreTotal: 40,
      scorePercent: 70,
      detailUrl: "",
      source: "ielts",
    },
    {
      externalId: "CB-1NTL",
      studentName: "Phạm Đức D",
      branch: PlacementBranch.NTL,
      testLabel: "Cambridge Placement — Starters",
      testSlug: "cambridge-starters",
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
      scoreCorrect: 18,
      scoreTotal: 25,
      scorePercent: 72,
      detailUrl: "",
      source: "cambridge",
    },
    {
      externalId: "CB-1XVN",
      studentName: "Hoàng Mai E",
      branch: PlacementBranch.XVNT,
      testLabel: "Cambridge Placement — Movers",
      testSlug: "cambridge-movers",
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
      scoreCorrect: 22,
      scoreTotal: 30,
      scorePercent: 73.3,
      detailUrl: "",
      source: "cambridge",
    },
    {
      externalId: "TC-1NTL",
      studentName: "Võ Anh F",
      branch: PlacementBranch.NTL,
      testLabel: "TOEIC Placement",
      testSlug: "toeic-placement",
      finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 30),
      scoreCorrect: 65,
      scoreTotal: 100,
      scorePercent: 65,
      detailUrl: "",
      source: "toeic",
    },
  ];

  // Drop legacy demo ids so re-seed matches the current sample set.
  await prisma.placementAttempt.deleteMany({
    where: { externalId: { startsWith: "seed-" } },
  });

  for (const row of samples) {
    await prisma.placementAttempt.upsert({
      where: { externalId: row.externalId },
      update: { ...row },
      create: { ...row },
    });
  }

  const chats = [
    {
      externalId: "seed-web-visitor-001",
      contactName: "Website visitor",
      contactEmail: null as string | null,
      contactPhone: null as string | null,
      channel: "WEB",
      conversationType: "chat",
      lastMessage: "Cho mình hỏi lịch học IELTS cuối tuần?",
      status: FastbotsChatStatus.OPEN,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      closedAt: null as Date | null,
      tags: ["seed", "web"],
      rawPayload: {
        messages: [
          {
            role: "visitor",
            text: "Cho mình hỏi lịch học IELTS cuối tuần?",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          },
          {
            role: "bot",
            text: "Bạn muốn cơ sở NTL hay XVNT ạ?",
            createdAt: new Date(
              Date.now() - 1000 * 60 * 60 * 4 + 60_000,
            ).toISOString(),
          },
        ],
      } as Prisma.InputJsonValue,
    },
    {
      externalId: "seed-web-test-002",
      contactName: "Test Contact",
      contactEmail: "test@example.com",
      contactPhone: null,
      channel: "WEB",
      conversationType: "chat",
      lastMessage: "Cảm ơn bạn!",
      status: FastbotsChatStatus.OPEN,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 28),
      closedAt: null,
      tags: ["seed", "web"],
      rawPayload: {
        messages: [
          {
            role: "visitor",
            text: "Học phí khóa foundation bao nhiêu?",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
          },
          {
            role: "bot",
            text: "Bạn để lại SĐT, tư vấn viên sẽ gọi lại trong ngày.",
            createdAt: new Date(
              Date.now() - 1000 * 60 * 60 * 28 + 90_000,
            ).toISOString(),
          },
          {
            role: "visitor",
            text: "Cảm ơn bạn!",
            createdAt: new Date(
              Date.now() - 1000 * 60 * 60 * 27,
            ).toISOString(),
          },
        ],
      } as Prisma.InputJsonValue,
    },
    {
      externalId: "seed-messenger-003",
      contactName: "Messenger User",
      contactEmail: null,
      contactPhone: null,
      channel: "MESSENGER",
      conversationType: "messenger",
      lastMessage: "Mình muốn đăng ký thi thử.",
      status: FastbotsChatStatus.OPEN,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 10),
      closedAt: null,
      tags: ["seed", "messenger"],
      rawPayload: {
        messages: [
          {
            role: "visitor",
            text: "Mình muốn đăng ký thi thử.",
            channel: "MESSENGER",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
          },
        ],
      } as Prisma.InputJsonValue,
    },
    {
      externalId: "seed-api-004",
      contactName: "API Contact",
      contactEmail: "api@wewin.local",
      contactPhone: "0900000000",
      channel: "API",
      conversationType: "api",
      lastMessage: "Ping from seed",
      status: FastbotsChatStatus.CLOSED,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      closedAt: new Date(Date.now() - 1000 * 60 * 60 * 47),
      tags: ["seed"],
      rawPayload: {
        messages: [
          {
            role: "visitor",
            text: "Ping from seed",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          },
          {
            role: "agent",
            text: "Đã nhận.",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
          },
        ],
      } as Prisma.InputJsonValue,
    },
  ];

  for (const chat of chats) {
    await prisma.fastbotsConversation.upsert({
      where: { externalId: chat.externalId },
      update: { ...chat },
      create: { ...chat },
    });
  }

  console.log(
    `Seeded admin ${email} / ${username}, ${samples.length} placements, ${chats.length} chats`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
