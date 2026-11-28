import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getProductEmbedConsumeUrl,
  hubApiKeyOrNull,
  mintEmbedSsoToken,
} from "@/lib/embed-sso";
import {
  isProductId,
  PRODUCT_IDS,
  type ProductId,
} from "@/lib/products";
import {
  getSessionUser,
  isAdminRole,
  SessionError,
} from "@/lib/session";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store" };

const productEnum = z.enum(
  PRODUCT_IDS as unknown as [ProductId, ...ProductId[]],
);

const querySchema = z.object({
  product: productEnum,
  /** When "1", product apps may set Partitioned cookies for cross-site iframes. */
  embed: z.enum(["0", "1"]).optional(),
});

/**
 * Admin Panel embed SSO bridge → product admin area.
 * Iframe and «Mở tab mới» both hit this route; mints a short-lived token
 * and redirects to the product's /api/hub/embed-sso-consume.
 */
export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      const here = new URL(request.url);
      const login = new URL("/login", request.url);
      login.searchParams.set("next", `${here.pathname}${here.search}`);
      return NextResponse.redirect(login.toString(), {
        status: 302,
        headers: NO_STORE,
      });
    }
    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { code: "ADMIN_REQUIRED" },
        { status: 403, headers: NO_STORE },
      );
    }

    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      product: url.searchParams.get("product") ?? "",
      embed: url.searchParams.get("embed") === "1" ? "1" : "0",
    });
    if (!parsed.success || !isProductId(parsed.data.product)) {
      return NextResponse.json(
        { code: "INVALID_INPUT" },
        { status: 400, headers: NO_STORE },
      );
    }

    const product = parsed.data.product;
    const consumeBase = getProductEmbedConsumeUrl(product);
    if (!consumeBase) {
      return NextResponse.json(
        { code: "PRODUCT_URL_NOT_CONFIGURED" },
        { status: 503, headers: NO_STORE },
      );
    }

    const key = hubApiKeyOrNull();
    if (!key) {
      return NextResponse.json(
        { code: "HUB_NOT_CONFIGURED" },
        { status: 503, headers: NO_STORE },
      );
    }

    const token = mintEmbedSsoToken(
      {
        product,
        username: user.username,
        email: user.email,
      },
      key,
    );

    const target = new URL(consumeBase);
    target.searchParams.set("token", token);
    target.searchParams.set("product", product);
    if (parsed.data.embed === "1") {
      target.searchParams.set("embed", "1");
    }

    return NextResponse.redirect(target.toString(), {
      status: 302,
      headers: NO_STORE,
    });
  } catch (error) {
    if (error instanceof SessionError) {
      return NextResponse.json(
        { code: error.code },
        {
          status: error.code === "LOGIN_REQUIRED" ? 401 : 403,
          headers: NO_STORE,
        },
      );
    }
    console.error("[api/sso/embed]", error);
    return NextResponse.json(
      { code: "SERVER_ERROR" },
      { status: 500, headers: NO_STORE },
    );
  }
}
