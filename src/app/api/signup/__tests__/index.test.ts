// Phase 2 integration tests for signup (src/app/api/signup/index.ts).
//
// prismock backs the real queries incl. the OTP-validation lookup — the link
// that closes the auth loop: signup only proceeds when a validate row for
// (email, request_id) reached status=valid via the OTP endpoint.
//
// serverFunctions is stubbed (heavy imports), but with faithful behavior:
// isExistUserId queries prismock and checkUserStatus mirrors the real 2-line
// logic. appCache is stubbed with per-test settings. bcrypt runs for real so
// the stored hash is verified with bcrypt.compare.
jest.mock("../../../../helpers/server/prismaClient", () => {
  const { PrismockClient } = require("prismock");
  return { prisma: new PrismockClient() };
});

jest.mock("../../../../helpers/server/serverFunctions", () => ({
  isExistUserId: jest.fn(),
  checkUserStatus: jest.fn(),
}));

jest.mock("../../../../helpers/server/serverCache", () => ({
  CacheKey: {
    GeneralSettings: "generalSettings",
    UserSettings: "userSettings",
  },
  appCache: { getByKey: jest.fn() },
}));

import bcrypt from "bcrypt";
import { prisma } from "../../../../helpers/server/prismaClient";
import {
  isExistUserId,
  checkUserStatus,
} from "../../../../helpers/server/serverFunctions";
import { appCache } from "../../../../helpers/server/serverCache";
import { POST } from "@/app/api/signup";
import { ToastData } from "@/helpers/toastData";
import { ValidateStatus, UserSettings } from "@/helpers/types";
import { seedUser, seedProfile } from "testHelper/p2pFixtures";

const db = prisma as any;
const getByKeyMock = appCache.getByKey as jest.Mock;

const EMAIL = "new@example.com";
const REQUEST_ID = "req-1";

const signupJson = (over: Record<string, unknown> = {}) =>
  ({
    email: EMAIL,
    username: "newuser",
    displayname: "새유저",
    password: "secret1",
    phone_number: "01012345678",
    request_id: REQUEST_ID,
    ...over,
  }) as any;

const seedValidatedOtp = (over: Record<string, unknown> = {}) =>
  db.validate.create({
    data: {
      email: EMAIL,
      validate_data: "111111",
      type: "email",
      status: ValidateStatus.valid,
      request_id: REQUEST_ID,
      updated_at: new Date(),
      ...over,
    },
  });

beforeEach(async () => {
  for (const model of ["validate", "settings", "profile", "user"]) {
    await db[model]?.deleteMany({});
  }
  getByKeyMock.mockImplementation((key: string) =>
    key === "generalSettings"
      ? { allow_user_registration: true }
      : { default_auth_level: 1, default_user_level: 2 }
  );
  // Faithful stand-ins for the real helpers (their module is too heavy to
  // import under Jest — it drags in the NextAuth config and webpush).
  (isExistUserId as jest.Mock).mockImplementation((username: string) =>
    db.user.findFirst({ where: { username } })
  );
  (checkUserStatus as jest.Mock).mockImplementation((user: any) =>
    user.is_active ? undefined : ToastData.inactive
  );
});

describe("signup — guards", () => {
  it("rejects when required props are missing", async () => {
    const res = await POST(signupJson({ username: undefined }));

    expect(res).toEqual({ result: false, message: ToastData.unknown });
  });

  it("rejects when registration is disabled", async () => {
    getByKeyMock.mockImplementation((key: string) =>
      key === "generalSettings"
        ? { allow_user_registration: false }
        : { default_auth_level: 1, default_user_level: 2 }
    );

    const res = await POST(signupJson());

    expect(res).toEqual({
      result: false,
      message: String(ToastData.notAllowSignup),
    });
  });

  it("rejects when no OTP validation exists for the email/request_id", async () => {
    const res = await POST(signupJson());

    expect(res).toEqual({ result: false, message: String(ToastData.unknown) });
    expect(await db.user.findMany({})).toHaveLength(0);
  });

  it("rejects when the OTP is still in progress (not yet verified)", async () => {
    await seedValidatedOtp({ status: ValidateStatus.progress });

    const res = await POST(signupJson());

    expect(res).toEqual({ result: false, message: String(ToastData.unknown) });
  });
});

describe("signup — duplicate checks", () => {
  beforeEach(() => seedValidatedOtp());

  it("rejects an existing username", async () => {
    await seedUser(db, { id: "u-exist", username: "newuser" });

    const res = await POST(signupJson());

    expect(res).toEqual({
      result: false,
      message: String(ToastData.alreadyExistId),
    });
  });

  it("rejects an existing username + displayname combination", async () => {
    await seedUser(db, { id: "u-exist", username: "newuser" });
    await seedProfile(db, { uid: "u-exist", displayname: "새유저" });

    const res = await POST(signupJson());

    expect(res).toEqual({
      result: false,
      message: String(ToastData.alreadyExistIdAndDisplayname),
    });
  });

  it("rejects an existing displayname", async () => {
    await seedUser(db, { id: "u-exist", username: "otheruser" });
    await seedProfile(db, { uid: "u-exist", displayname: "새유저" });

    const res = await POST(signupJson());

    expect(res).toEqual({
      result: false,
      message: String(ToastData.alreadyExistDisplayname),
    });
  });

  it("rejects an email already attached to a profile", async () => {
    await seedUser(db, { id: "u-exist", username: "otheruser" });
    await seedProfile(db, { uid: "u-exist", email: EMAIL });

    const res = await POST(signupJson());

    expect(res).toEqual({
      result: false,
      message: String(ToastData.alreadyExistEmail),
    });
  });

  it("rejects an inactive account before the duplicate checks", async () => {
    await seedUser(db, {
      id: "u-exist",
      username: "newuser",
      is_active: false,
    });

    const res = await POST(signupJson());

    expect(res).toEqual({
      result: false,
      message: String(ToastData.inactive),
    });
  });
});

describe("signup — account creation", () => {
  it("creates the user with hashed password, validated profile and default settings", async () => {
    await seedValidatedOtp();

    const res = await POST(signupJson());

    expect(res).toEqual({ result: true, message: ToastData.signup });

    // select avoids trade_rate: prismock materializes the schema's Decimal
    // default as a decimal.js instance whose own `constructor` property makes
    // structuredClone (used by prismock when returning full rows) throw.
    const users = await db.user.findMany({
      select: { username: true, password: true },
    });
    expect(users).toHaveLength(1);
    expect(users[0].username).toBe("newuser");
    // Stored as a bcrypt hash, not plaintext.
    expect(users[0].password).not.toBe("secret1");
    expect(await bcrypt.compare("secret1", users[0].password)).toBe(true);

    const profiles = await db.profile.findMany({});
    expect(profiles).toHaveLength(1);
    expect(profiles[0]).toMatchObject({
      displayname: "새유저",
      email: EMAIL,
      email_is_validated: true,
      auth_level: 1, // from cached user_setting
      user_level: 2,
    });

    // One notification-settings row per UserSettings key, all default true.
    const settings = await db.settings.findMany({});
    expect(settings.map((s: any) => s.key).sort()).toEqual(
      Object.keys(UserSettings).sort()
    );
    expect(settings.every((s: any) => s.value === "true")).toBe(true);
  });
});
