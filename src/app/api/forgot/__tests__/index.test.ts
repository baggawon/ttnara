// Phase 2 integration tests for forgot-password / forgot-id
// (src/app/api/forgot/index.ts). Same auth-loop link as signup: both flows
// only proceed when a validate row (email, request_id) reached status=valid.
jest.mock("../../../../helpers/server/prismaClient", () => {
  const { PrismockClient } = require("prismock");
  return { prisma: new PrismockClient() };
});

jest.mock("../../../../helpers/server/serverCache", () => ({
  CacheKey: {
    GeneralSettings: "generalSettings",
    UserSettings: "userSettings",
  },
  appCache: { getByKey: jest.fn() },
}));

import bcrypt from "bcrypt";
import { prisma } from "../../../../helpers/server/prismaClient";
import { appCache } from "../../../../helpers/server/serverCache";
import { POST } from "@/app/api/forgot";
import { ToastData } from "@/helpers/toastData";
import { ForgotTypes, ValidateStatus } from "@/helpers/types";
import { seedUser, seedProfile } from "testHelper/p2pFixtures";

const db = prisma as any;
const getByKeyMock = appCache.getByKey as jest.Mock;

const EMAIL = "member@example.com";
const REQUEST_ID = "req-9";
const UID = "u-member";

const forgotJson = (over: Record<string, unknown> = {}) =>
  ({
    forgotType: ForgotTypes.Password,
    email: EMAIL,
    request_id: REQUEST_ID,
    password: "newpass1",
    passwordConfirm: "newpass1",
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

const seedMember = async () => {
  await seedUser(db, { id: UID, username: "memberuser" });
  await seedProfile(db, { uid: UID, email: EMAIL });
};

beforeEach(async () => {
  for (const model of ["validate", "profile", "user"]) {
    await db[model].deleteMany({});
  }
  getByKeyMock.mockReturnValue({
    default_auth_level: 1,
    default_user_level: 1,
  });
});

describe("forgot — guards", () => {
  it("rejects an invalid forgotType", async () => {
    const res = await POST(forgotJson({ forgotType: "nope" }));

    expect(res).toEqual({ result: false, message: ToastData.unknown });
  });

  it("rejects without a validated OTP row", async () => {
    await seedMember();

    const res = await POST(forgotJson());

    expect(res).toEqual({ result: false, message: String(ToastData.unknown) });
  });

  it("rejects when the OTP row is still in progress", async () => {
    await seedMember();
    await seedValidatedOtp({ status: ValidateStatus.progress });

    const res = await POST(forgotJson());

    expect(res).toEqual({ result: false, message: String(ToastData.unknown) });
  });
});

describe("forgot — password reset", () => {
  it("rejects a mismatched password confirmation", async () => {
    await seedMember();
    await seedValidatedOtp();

    const res = await POST(forgotJson({ passwordConfirm: "different1" }));

    expect(res).toEqual({ result: false, message: String(ToastData.unknown) });
  });

  it("rejects a missing password", async () => {
    await seedMember();
    await seedValidatedOtp();

    const res = await POST(
      forgotJson({ password: undefined, passwordConfirm: undefined })
    );

    expect(res).toEqual({ result: false, message: String(ToastData.unknown) });
  });

  it("re-hashes the password for the user owning the profile email", async () => {
    await seedMember();
    await seedValidatedOtp();

    const res = await POST(forgotJson());

    expect(res).toEqual({
      result: true,
      message: ToastData.passwordUpdate,
    });
    const user = await db.user.findFirst({
      where: { id: UID },
      select: { password: true },
    });
    expect(user.password).not.toBe("newpass1");
    expect(await bcrypt.compare("newpass1", user.password)).toBe(true);
  });
});

describe("forgot — username recovery", () => {
  it("returns the username for the profile email", async () => {
    await seedMember();
    await seedValidatedOtp();

    const res = await POST(forgotJson({ forgotType: ForgotTypes.Id }));

    expect(res).toEqual({ result: true, data: "memberuser" });
  });

  it("rejects when no user owns the email", async () => {
    await seedValidatedOtp();

    const res = await POST(forgotJson({ forgotType: ForgotTypes.Id }));

    expect(res).toEqual({ result: false, message: String(ToastData.unknown) });
  });
});
