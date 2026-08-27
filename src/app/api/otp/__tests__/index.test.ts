// Phase 2 integration tests for the OTP flow (src/app/api/otp/index.ts).
//
// Strategy: prismock replaces the deepest prisma dep so the real handleConnect
// and all validate/profile queries run against an in-memory DB. SES and brand
// settings are stubbed (external IO); the email-template loading + rendering
// runs FOR REAL against prismock (empty table → built-in default copy), so a
// send test verifies the whole chain: template default → render → SES payload.
//
// Time-dependent branches (resend throttle, 30-min expiry) are tested by
// seeding at the real clock and then travelling FORWARD with fake timers —
// this avoids fighting prismock's @updatedAt auto-stamping on seeded rows.
jest.mock("../../../../helpers/server/prismaClient", () => {
  const { PrismockClient } = require("prismock");
  return { prisma: new PrismockClient() };
});

jest.mock("../../../../helpers/server/ses", () => ({
  sendEmail: jest.fn(),
}));

// brandSettings pulls in react cache + CloudFront signing; stub the module.
jest.mock("../../../../helpers/server/brandSettings", () => ({
  getBrandSettings: jest.fn(async () => ({
    siteName: "테스트브랜드",
    logoImageUrl: null,
    faviconUrl: null,
  })),
}));

import { prisma } from "../../../../helpers/server/prismaClient";
import { sendEmail } from "../../../../helpers/server/ses";
import { POST } from "@/app/api/otp";
import { ApiOtpType, ValidateStatus } from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";

const db = prisma as any;
const sendEmailMock = sendEmail as jest.Mock;

const EMAIL = "user@example.com";
const MESSAGE_ID = "ses-msg-1";

// updated_at must be seeded explicitly: prismock leaves @updatedAt columns
// null (on create AND update), and dayjs(null) yields NaN diffs — which would
// silently disable every throttle/expiry branch under test.
const seedValidate = (over: Record<string, unknown> = {}) =>
  db.validate.create({
    data: {
      email: EMAIL,
      validate_data: "111111",
      type: "email",
      status: ValidateStatus.progress,
      request_id: "req-1",
      updated_at: new Date(),
      ...over,
    },
  });

const travelMinutes = (minutes: number) => {
  const target = Date.now() + minutes * 60_000;
  jest.useFakeTimers();
  jest.setSystemTime(target);
};

const ORIGINAL_SES_SENDER = process.env.SES_SENDER_EMAIL;
const ENV_SENDER = "sender@test.local";

beforeEach(async () => {
  sendEmailMock.mockResolvedValue({ MessageId: MESSAGE_ID });
  // Pin the env sender: next/jest loads the real .env, so without this the
  // assertion on the resolved from-address would depend on the dev machine.
  process.env.SES_SENDER_EMAIL = ENV_SENDER;
  await db.validate.deleteMany({});
  await db.profile.deleteMany({});
});

afterEach(() => {
  jest.useRealTimers();
});

afterAll(() => {
  if (ORIGINAL_SES_SENDER === undefined) delete process.env.SES_SENDER_EMAIL;
  else process.env.SES_SENDER_EMAIL = ORIGINAL_SES_SENDER;
});

describe("OTP — EmailSignup", () => {
  const signup = { email: EMAIL, validate_type: ApiOtpType.EmailSignup };

  it("rejects an email that already belongs to a profile", async () => {
    await db.profile.create({
      data: { uid: "u1", displayname: "tester", email: EMAIL },
    });

    const res = await POST(signup);

    expect(res).toEqual({
      result: false,
      message: String(ToastData.alreadyExistEmail),
    });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("sends a rendered OTP email and stores the code", async () => {
    const res = await POST(signup);

    expect(res).toEqual({
      result: true,
      message: ToastData.sendOtp,
      data: MESSAGE_ID,
    });

    const rows = await db.validate.findMany({ where: { email: EMAIL } });
    expect(rows).toHaveLength(1);
    expect(rows[0].validate_data).toMatch(/^\d{6}$/);
    expect(rows[0].type).toBe("email");
    expect(rows[0].status).toBe(ValidateStatus.progress);
    expect(rows[0].request_id).toBe(MESSAGE_ID);

    // Full-chain check: default template rendered with brand + code, sent to
    // the requester from the env-fallback sender (no sender rows in DB).
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const [to, subject, html, from] = sendEmailMock.mock.calls[0];
    expect(to).toBe(EMAIL);
    expect(subject).toContain("테스트브랜드");
    expect(html).toContain(rows[0].validate_data);
    expect(from).toBe(ENV_SENDER);
  });

  it("throttles resend within 2 minutes of a pending code", async () => {
    await seedValidate();

    const res = await POST(signup);

    expect(res).toEqual({
      result: false,
      message: String(ToastData.alreadySend),
    });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("allows resend once the 2-minute window has passed", async () => {
    await seedValidate();
    travelMinutes(3);

    const res = await POST(signup);

    expect(res.result).toBe(true);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    // NOTE: the old progress row is not cleaned up — a resend leaves two
    // active codes for the same email. Pinned as current behavior.
    const rows = await db.validate.findMany({ where: { email: EMAIL } });
    expect(rows).toHaveLength(2);
  });

  it("fails without storing a code when SES returns no MessageId", async () => {
    sendEmailMock.mockResolvedValue({ MessageId: undefined });

    const res = await POST(signup);

    expect(res).toEqual({ result: false, message: String(ToastData.unknown) });
    expect(await db.validate.findMany({})).toHaveLength(0);
  });
});

describe("OTP — EmailValid", () => {
  const valid = (otp: string) => ({
    email: EMAIL,
    otp,
    request_id: "req-1",
    validate_type: ApiOtpType.EmailValid,
  });

  it("rejects when required params are missing", async () => {
    const res = await POST({ validate_type: ApiOtpType.EmailValid });

    expect(res).toEqual({ result: false, message: String(ToastData.unknown) });
  });

  it("marks the code valid when correct and within 30 minutes", async () => {
    await seedValidate();

    const res = await POST(valid("111111"));

    expect(res).toEqual({ result: true });
    const rows = await db.validate.findMany({ where: { email: EMAIL } });
    expect(rows[0].status).toBe(ValidateStatus.valid);
  });

  it("increments the attempt counter on a wrong code, keeping the row retryable", async () => {
    await seedValidate();

    const res = await POST(valid("222222"));

    expect(res).toEqual({ result: false, message: ToastData.otpError });
    const rows = await db.validate.findMany({ where: { email: EMAIL } });
    expect(rows[0].attempt_count).toBe(1);
    // stays in progress — a wrong attempt must not lock out the retry lookup
    expect(rows[0].status).toBe(ValidateStatus.progress);
    expect(rows[0].blocked_until).toBeNull();
  });

  it("blocks for 5 minutes on the 5th wrong attempt", async () => {
    await seedValidate({ attempt_count: 4 });

    const res = await POST(valid("222222"));

    expect(res).toEqual({
      result: false,
      message: String(ToastData.tooManyAttempts),
    });
    const rows = await db.validate.findMany({ where: { email: EMAIL } });
    expect(rows[0].attempt_count).toBe(5);
    expect(rows[0].blocked_until).not.toBeNull();
  });

  it("rejects immediately while a block is active, even with the right code", async () => {
    await seedValidate({
      blocked_until: new Date(Date.now() + 5 * 60_000),
    });

    const res = await POST(valid("111111"));

    expect(res).toEqual({
      result: false,
      message: String(ToastData.tooManyAttempts),
    });
    const rows = await db.validate.findMany({ where: { email: EMAIL } });
    expect(rows[0].status).toBe(ValidateStatus.progress); // untouched
  });

  it("reports timeOut for a correct code older than 30 minutes", async () => {
    await seedValidate();
    travelMinutes(31);

    const res = await POST(valid("111111"));

    expect(res).toEqual({ result: false, message: ToastData.timeOut });
  });

  it("rejects an unknown request_id with 'unknown'", async () => {
    const res = await POST(valid("111111"));

    expect(res).toEqual({ result: false, message: String(ToastData.unknown) });
  });

  it("verifies with the correct code after a wrong attempt", async () => {
    await seedValidate();
    await POST(valid("222222")); // one typo must not burn the request

    const res = await POST(valid("111111"));

    expect(res).toEqual({ result: true });
    const rows = await db.validate.findMany({ where: { email: EMAIL } });
    expect(rows[0].status).toBe(ValidateStatus.valid);
  });

  it("locks out after 5 consecutive wrong attempts, blocking even the correct code", async () => {
    await seedValidate();

    for (let attempt = 1; attempt <= 4; attempt++) {
      const res = await POST(valid("222222"));
      expect(res).toEqual({ result: false, message: ToastData.otpError });
    }

    const fifth = await POST(valid("222222"));
    expect(fifth).toEqual({
      result: false,
      message: String(ToastData.tooManyAttempts),
    });

    const blocked = await POST(valid("111111")); // correct, but within block
    expect(blocked).toEqual({
      result: false,
      message: String(ToastData.tooManyAttempts),
    });

    const rows = await db.validate.findMany({ where: { email: EMAIL } });
    expect(rows[0].attempt_count).toBe(5);
    expect(rows[0].blocked_until).not.toBeNull();
  });
});

describe("OTP — EmailForgotPassword", () => {
  const forgot = {
    email: EMAIL,
    validate_type: ApiOtpType.EmailForgotPassword,
  };

  it("reports no_user without sending when the email has no profile", async () => {
    const res = await POST(forgot);

    expect(res).toEqual({ result: false, error: "no_user" });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("sends a reset code and stores it for the profile's email", async () => {
    await db.profile.create({
      data: { uid: "u1", displayname: "tester", email: EMAIL },
    });

    const res = await POST(forgot);

    expect(res).toEqual({ result: true, data: MESSAGE_ID });
    const rows = await db.validate.findMany({ where: { email: EMAIL } });
    expect(rows).toHaveLength(1);
    expect(rows[0].request_id).toBe(MESSAGE_ID);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });

  it("asks the user to wait when a code was sent under 2 minutes ago", async () => {
    await db.profile.create({
      data: { uid: "u1", displayname: "tester", email: EMAIL },
    });
    await seedValidate();

    const res = await POST(forgot);

    expect(res).toEqual({ result: false, error: ToastData.waitSend });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});

describe("OTP — EmailSettings", () => {
  const settings = { email: EMAIL, validate_type: ApiOtpType.EmailSettings };

  it("sends a code and stores it", async () => {
    const res = await POST(settings);

    expect(res).toEqual({ result: true, data: MESSAGE_ID });
    const rows = await db.validate.findMany({ where: { email: EMAIL } });
    expect(rows).toHaveLength(1);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });

  it("asks the user to wait when a code was sent under 2 minutes ago", async () => {
    await seedValidate();

    const res = await POST(settings);

    expect(res).toEqual({ result: false, error: ToastData.waitSend });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
