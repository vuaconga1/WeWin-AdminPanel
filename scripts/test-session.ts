import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { decodeSession } from "../src/lib/session";

process.env.SESSION_SECRET = "test-session-secret-16";

function mint(user: Record<string, unknown>): string {
  const body = Buffer.from(
    JSON.stringify({ ...user, exp: Date.now() + 60_000 }),
  ).toString("base64url");
  const sig = createHmac("sha256", process.env.SESSION_SECRET!)
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

const token = mint({
  id: "u1",
  email: "admin@wewin.local",
  username: "admin",
  fullName: "Admin",
  role: "ADMIN",
});

const user = decodeSession(token);
assert.ok(user);
assert.equal(user!.role, "ADMIN");
assert.equal(user!.username, "admin");

assert.equal(decodeSession("bad.token"), null);
assert.equal(decodeSession(`${token}x`), null);

console.log("session decode: ok");
