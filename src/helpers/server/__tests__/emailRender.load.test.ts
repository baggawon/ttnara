// Phase 2 integration test: exercises loadEmailTemplateForSend() against a real
// in-memory Prisma engine (prismock) so the actual findUnique/findFirst queries
// — including the fallback-sender orderBy — are verified, not stubbed.
//
// We mock the DEEPEST dependency (prismaClient singleton) with a prismock
// instance and let the real handleConnect() run against it. jest.mock() does not
// apply the "@/" alias, so mock by relative path; it still intercepts the SUT's
// "@/helpers/server/prismaClient" import since matching is by resolved file.
jest.mock("../prismaClient", () => {
  const { PrismockClient } = require("prismock");
  return { prisma: new PrismockClient() };
});

import { prisma } from "../prismaClient";
import { loadEmailTemplateForSend } from "@/helpers/server/emailRender";
import { findEmailTemplateDefault } from "@/helpers/emailTemplateDefaults";

const db = prisma as any;

const seedSender = (over: Record<string, unknown> = {}) =>
  db.email_sender.create({
    data: {
      label: "sender",
      email: "sender@example.com",
      is_default: false,
      is_active: true,
      ...over,
    },
  });

const seedTemplate = (over: Record<string, unknown> = {}) =>
  db.email_template.create({
    data: {
      key: "welcome",
      name: "welcome",
      subject: "[{{siteName}}] 환영합니다",
      body: "본문",
      footer_text: "푸터",
      contact_email: "contact@example.com",
      sender_id: null,
      ...over,
    },
  });

const ORIGINAL_ENV = process.env.SES_SENDER_EMAIL;

beforeEach(async () => {
  await db.email_template.deleteMany({});
  await db.email_sender.deleteMany({});
  delete process.env.SES_SENDER_EMAIL;
});

afterEach(() => {
  if (ORIGINAL_ENV === undefined) delete process.env.SES_SENDER_EMAIL;
  else process.env.SES_SENDER_EMAIL = ORIGINAL_ENV;
});

describe("loadEmailTemplateForSend — template present", () => {
  it("returns the template fields and its active sender's email", async () => {
    await seedSender({ id: 1, email: "noreply@site.com", is_default: true });
    await seedTemplate({ sender_id: 1 });

    const result = await loadEmailTemplateForSend("welcome");

    expect(result).toEqual({
      subject: "[{{siteName}}] 환영합니다",
      body: "본문",
      footerText: "푸터",
      senderEmail: "noreply@site.com",
      contactEmail: "contact@example.com",
    });
  });

  it("maps null footer_text/contact_email to footerText null and contactEmail empty", async () => {
    await seedSender({ id: 1, email: "noreply@site.com" });
    await seedTemplate({
      sender_id: 1,
      footer_text: null,
      contact_email: null,
    });

    const result = await loadEmailTemplateForSend("welcome");

    expect(result.footerText).toBeNull();
    expect(result.contactEmail).toBe("");
  });

  it("falls back to another active sender when the template's sender is inactive", async () => {
    await seedSender({ id: 1, email: "inactive@site.com", is_active: false });
    await seedSender({ id: 2, email: "active@site.com", is_default: true });
    await seedTemplate({ sender_id: 1 });

    const result = await loadEmailTemplateForSend("welcome");

    expect(result.senderEmail).toBe("active@site.com");
  });

  it("falls back to env sender when the template's sender is inactive and none are active", async () => {
    process.env.SES_SENDER_EMAIL = "env@site.com";
    await seedSender({ id: 1, email: "inactive@site.com", is_active: false });
    await seedTemplate({ sender_id: 1 });

    const result = await loadEmailTemplateForSend("welcome");

    expect(result.senderEmail).toBe("env@site.com");
  });
});

describe("loadEmailTemplateForSend — fallback sender ordering", () => {
  // Asserts the query CONTRACT (default-first, then id) rather than prismock's
  // sorted output: prismock does not faithfully emulate boolean `desc` ordering,
  // so the is_default-preference is verified via the orderBy the code issues,
  // which is what real Postgres acts on.
  it("queries active senders ordered by is_default desc then id asc", async () => {
    const spy = jest.spyOn(db.email_sender, "findFirst");
    await seedSender({ id: 2, email: "default@site.com", is_default: true });
    await seedTemplate({ sender_id: null });

    await loadEmailTemplateForSend("welcome");

    expect(spy).toHaveBeenCalledWith({
      where: { is_active: true },
      orderBy: [{ is_default: "desc" }, { id: "asc" }],
    });
    spy.mockRestore();
  });

  it("picks the lowest id when no sender is marked default", async () => {
    await seedSender({ id: 5, email: "five@site.com", is_default: false });
    await seedSender({ id: 3, email: "three@site.com", is_default: false });
    await seedTemplate({ sender_id: null });

    const result = await loadEmailTemplateForSend("welcome");

    expect(result.senderEmail).toBe("three@site.com");
  });
});

describe("loadEmailTemplateForSend — no template row", () => {
  it("falls back to the built-in default copy for a known key", async () => {
    process.env.SES_SENDER_EMAIL = "env@site.com";
    const def = findEmailTemplateDefault("email_signup");

    const result = await loadEmailTemplateForSend("email_signup");

    expect(result.subject).toBe(def?.subject);
    expect(result.body).toBe(def?.body);
    expect(result.footerText).toBe(def?.footerText ?? null);
    expect(result.contactEmail).toBe("");
    expect(result.senderEmail).toBe("env@site.com");
  });

  it("uses a generic subject and empty sender for an unknown key with no senders/env", async () => {
    const result = await loadEmailTemplateForSend("no_such_key");

    expect(result.subject).toBe("[{{siteName}}] 알림");
    expect(result.body).toBe("");
    expect(result.footerText).toBeNull();
    expect(result.senderEmail).toBe("");
    expect(result.contactEmail).toBe("");
  });
});
