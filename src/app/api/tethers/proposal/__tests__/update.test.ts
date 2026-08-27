// Phase 2 integration tests for P2P proposal create/update/cancel
// (src/app/api/tethers/proposal/update/index.ts).
//
// prismock backs the real handleConnect + $transaction; serverFunctions is
// fully stubbed because it drags in the NextAuth config and webpush at module
// load. requestValidator is controlled per test to act as different users.
//
// Coverage note: prismock's interactive $transaction has NO rollback
// semantics, so only committed happy paths are asserted — partial-failure
// rollback is not testable here.
jest.mock("../../../../../helpers/server/prismaClient", () => {
  const { PrismockClient } = require("prismock");
  return { prisma: new PrismockClient() };
});

jest.mock("../../../../../helpers/server/serverFunctions", () => ({
  RequestValidator: { User: "user", Admin: "admin" },
  requestValidator: jest.fn(),
  sendWebpush: jest.fn(),
  // Passthrough so sendWebpush assertions can inspect type/recipient.
  makeMessagePayload: jest.fn((args: any) => args),
  // Mirrors the real select shape — it is spread into prisma queries, so it
  // must stay a valid select for the user model.
  webPushUserSelect: {
    id: true,
    push_token: true,
    profile: { select: { displayname: true } },
    settings: { select: { key: true, value: true } },
  },
}));

import { prisma } from "../../../../../helpers/server/prismaClient";
import {
  requestValidator,
  sendWebpush,
} from "../../../../../helpers/server/serverFunctions";
import { POST } from "@/app/api/tethers/proposal/update";
import { ToastData } from "@/helpers/toastData";
import { TetherProposalStatus, TetherStatus } from "@/helpers/types";
import {
  OWNER_ID,
  PROPOSER_ID,
  OUTSIDER_ID,
  seedUser,
  seedProposal,
  seedTradeScene,
} from "testHelper/p2pFixtures";

const db = prisma as any;
const requestValidatorMock = requestValidator as jest.Mock;
const sendWebpushMock = sendWebpush as jest.Mock;

const actAs = (uid: string) =>
  requestValidatorMock.mockResolvedValue({
    uid,
    session: { user: { displayname: `display-${uid}` } },
  });

const createProposal = (over: Record<string, unknown> = {}) =>
  ({
    id: 0,
    tether_id: 1,
    price: 1400,
    qty: 500,
    telegram_id: "tg-id",
    messenger_type: "telegram",
    currency: "KRW",
    status: TetherProposalStatus.Open,
    ...over,
  }) as any;

beforeEach(async () => {
  for (const model of [
    "tether_rate",
    "tether_proposal",
    "tether",
    "profile",
    "user",
  ]) {
    await db[model].deleteMany({});
  }
});

describe("proposal create (id === 0)", () => {
  it("rejects when price is missing", async () => {
    actAs(PROPOSER_ID);

    const res = await POST(createProposal({ price: undefined }));

    expect(res).toEqual({ result: false, message: String(ToastData.unknown) });
  });

  it("rejects an empty-string messenger id", async () => {
    actAs(PROPOSER_ID);

    const res = await POST(createProposal({ telegram_id: "" }));

    expect(res).toEqual({ result: false, message: String(ToastData.unknown) });
  });

  it("creates the proposal, flips the tether to progress and notifies the owner", async () => {
    const tether = await seedTradeScene(db);
    actAs(PROPOSER_ID);

    const res = await POST(createProposal({ tether_id: tether.id }));

    expect(res).toEqual({
      result: true,
      message: ToastData.threadProposalCreate,
    });

    const updatedTether = await db.tether.findFirst({
      where: { id: tether.id },
    });
    expect(updatedTether.status).toBe(TetherStatus.Progress);

    const proposals = await db.tether_proposal.findMany({});
    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({
      tether_id: tether.id,
      user_id: PROPOSER_ID,
      status: TetherProposalStatus.Open,
      reason: null,
      telegram_id: "tg-id",
    });

    const proposer = await db.user.findFirst({ where: { id: PROPOSER_ID } });
    expect(proposer.trade_joined).toBe(1);

    // New-proposal push goes to the tether owner only.
    expect(sendWebpushMock).toHaveBeenCalledTimes(1);
    const [payloads, users] = sendWebpushMock.mock.calls[0];
    expect(payloads).toHaveLength(1);
    expect(users.map((u: any) => u.id)).toEqual([OWNER_ID]);
  });

  it("rejects a qty below the tether's minimum", async () => {
    const tether = await seedTradeScene(db, { min_qty: 100, max_qty: 1000 });
    actAs(PROPOSER_ID);

    const res = await POST(createProposal({ tether_id: tether.id, qty: 50 }));

    expect(res).toEqual({ result: false, message: String(ToastData.unknown) });
    expect(await db.tether_proposal.findMany({})).toHaveLength(0);
  });

  it("rejects a qty above the tether's maximum", async () => {
    const tether = await seedTradeScene(db, { min_qty: 100, max_qty: 1000 });
    actAs(PROPOSER_ID);

    const res = await POST(createProposal({ tether_id: tether.id, qty: 1001 }));

    expect(res).toEqual({ result: false, message: String(ToastData.unknown) });
  });

  it("rejects when the tether already has a proposal in progress", async () => {
    const tether = await seedTradeScene(db, {
      status: TetherStatus.Progress,
    });
    actAs(PROPOSER_ID);

    const res = await POST(createProposal({ tether_id: tether.id }));

    expect(res).toEqual({
      result: false,
      message: String(ToastData.existProposal),
    });
  });
});

// The cancel flow in the tether detail hook posts a proposal it read back from
// the detail API. Historically it spread that whole row, so prisma received the
// `tether_rate` relation array as an update column, rejected the query, and the
// swallowed failure surfaced as the generic "unknown" toast — every cancel
// failed. These lock the payload contract from both ends.
describe("payloads carrying read-API relations", () => {
  const readApiProposalRow = (over: Record<string, unknown> = {}) => ({
    // scalars, decimals already converted to numbers by the client
    tether_id: 1,
    user_id: PROPOSER_ID,
    telegram_id: null,
    kakao_id: "momomo1541",
    messenger_type: "kakaoTalk",
    price: 1377,
    qty: 350,
    currency: "USDT",
    status: TetherProposalStatus.Cancel,
    reason: null,
    created_at: "2026-08-27T00:00:00.000Z",
    updated_at: "2026-08-27T00:00:00.000Z",
    // relations the detail read includes — never valid as update columns
    user: null,
    tether_rate: [] as unknown[],
    ...over,
  });

  // `clearMocks` wipes a spy's implementation without restoring the original,
  // so any spy left standing would break the next test's prisma call.
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // prismock mutates the args object while it walks nested relation
  // operations, so snapshot what prisma was handed at call time.
  const captureTetherUpdateArgs = () => {
    const captured: any[] = [];
    const original = db.tether.update.bind(db.tether);
    jest.spyOn(db.tether, "update").mockImplementation((args: any) => {
      captured.push(structuredClone(args));
      return original(args);
    });
    return captured;
  };

  const WRITABLE_COLUMNS = [
    "telegram_id",
    "kakao_id",
    "messenger_type",
    "price",
    "qty",
    "currency",
    "status",
    "reason",
    "user_id",
  ];

  it("never forwards a relation field to prisma on cancel", async () => {
    const tether = await seedTradeScene(db, { status: TetherStatus.Progress });
    const proposal = await seedProposal(db, {
      tether_id: tether.id,
      user_id: PROPOSER_ID,
    });
    actAs(PROPOSER_ID);

    const captured = captureTetherUpdateArgs();

    const res = await POST(
      readApiProposalRow({ id: proposal.id, tether_id: tether.id }) as any
    );

    expect(res).toEqual({
      result: true,
      message: ToastData.threadProposalCancel,
    });

    const data = captured[0].data.tether_proposals.update.data;
    expect(Object.keys(data).sort()).toEqual(
      Object.keys(data)
        .filter((key) => WRITABLE_COLUMNS.includes(key))
        .sort()
    );
    expect(data).not.toHaveProperty("tether_rate");
    expect(data).not.toHaveProperty("user");
    expect(data).not.toHaveProperty("created_at");

    const updated = await db.tether_proposal.findFirst({
      where: { id: proposal.id },
    });
    expect(updated.status).toBe(TetherProposalStatus.Cancel);
    expect(updated.reason).toBe("proposal");
    // A cancel must not rewrite the agreed terms.
    expect(Number(updated.price)).toBe(1400);
    expect(Number(updated.qty)).toBe(500);
  });

  it("never forwards a relation field to prisma on create", async () => {
    const tether = await seedTradeScene(db);
    actAs(PROPOSER_ID);

    const captured = captureTetherUpdateArgs();

    const res = await POST(
      readApiProposalRow({
        id: 0,
        tether_id: tether.id,
        qty: 500,
        status: TetherProposalStatus.Open,
      }) as any
    );

    expect(res).toEqual({
      result: true,
      message: ToastData.threadProposalCreate,
    });

    const data = captured[0].data.tether_proposals.create;
    expect(Object.keys(data).sort()).toEqual(
      Object.keys(data)
        .filter((key) => WRITABLE_COLUMNS.includes(key))
        .sort()
    );
    expect(data).not.toHaveProperty("tether_rate");
    expect(data).not.toHaveProperty("id");
  });

  it("reports a rejected write as the generic error instead of a silent no-op", async () => {
    const tether = await seedTradeScene(db, { status: TetherStatus.Progress });
    const proposal = await seedProposal(db, {
      tether_id: tether.id,
      user_id: PROPOSER_ID,
    });
    actAs(PROPOSER_ID);

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    jest
      .spyOn(db.tether, "update")
      .mockRejectedValueOnce(new Error("Unknown argument `tether_rate`"));

    const res = await POST(
      readApiProposalRow({ id: proposal.id, tether_id: tether.id }) as any
    );

    expect(res).toEqual({ result: false, message: ToastData.unknown });
    // The real cause has to reach the server log, not just vanish.
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("tether.proposal.update:write"),
      expect.objectContaining({ message: "Unknown argument `tether_rate`" })
    );

    const untouched = await db.tether_proposal.findFirst({
      where: { id: proposal.id },
    });
    expect(untouched.status).toBe(TetherProposalStatus.Open);
  });
});

describe("proposal update / cancel (id !== 0)", () => {
  const seedProgressScene = async () => {
    const tether = await seedTradeScene(db, { status: TetherStatus.Progress });
    await seedUser(db, { id: OUTSIDER_ID });
    const proposal = await seedProposal(db, {
      tether_id: tether.id,
      user_id: PROPOSER_ID,
    });
    await db.user.update({
      where: { id: PROPOSER_ID },
      data: { trade_joined: 1 },
    });
    return { tether, proposal };
  };

  it("rejects a user who is neither tether owner nor proposal owner", async () => {
    const { tether, proposal } = await seedProgressScene();
    actAs(OUTSIDER_ID);

    const res = await POST(
      createProposal({
        id: proposal.id,
        tether_id: tether.id,
        status: TetherProposalStatus.Cancel,
      })
    );

    expect(res).toEqual({ result: false, message: String(ToastData.noAuth) });
  });

  it("lets the proposer update their open proposal without touching the tether", async () => {
    const { tether, proposal } = await seedProgressScene();
    actAs(PROPOSER_ID);

    const res = await POST(
      createProposal({
        id: proposal.id,
        tether_id: tether.id,
        price: 1500,
        qty: 600,
      })
    );

    expect(res).toEqual({
      result: true,
      message: ToastData.threadProposalUpdate,
    });
    const updated = await db.tether_proposal.findFirst({
      where: { id: proposal.id },
    });
    expect(updated.price).toBe(1500);
    expect(updated.qty).toBe(600);
    const updatedTether = await db.tether.findFirst({
      where: { id: tether.id },
    });
    expect(updatedTether.status).toBe(TetherStatus.Progress);
  });

  it("proposer cancel: reopens the tether, marks reason, decrements trade_joined, notifies both", async () => {
    const { tether, proposal } = await seedProgressScene();
    actAs(PROPOSER_ID);

    const res = await POST(
      createProposal({
        id: proposal.id,
        tether_id: tether.id,
        status: TetherProposalStatus.Cancel,
      })
    );

    expect(res).toEqual({
      result: true,
      message: ToastData.threadProposalCancel,
    });

    const updatedTether = await db.tether.findFirst({
      where: { id: tether.id },
    });
    expect(updatedTether.status).toBe(TetherStatus.Open);

    const updated = await db.tether_proposal.findFirst({
      where: { id: proposal.id },
    });
    expect(updated.status).toBe(TetherProposalStatus.Cancel);
    expect(updated.reason).toBe("proposal");

    const proposer = await db.user.findFirst({ where: { id: PROPOSER_ID } });
    expect(proposer.trade_joined).toBe(0);

    expect(sendWebpushMock).toHaveBeenCalledTimes(1);
    const [payloads, users] = sendWebpushMock.mock.calls[0];
    expect(payloads).toHaveLength(2);
    expect(users.map((u: any) => u.id).sort()).toEqual(
      [OWNER_ID, PROPOSER_ID].sort()
    );
  });

  it("owner cancel: marks reason 'owner' and notifies both parties", async () => {
    const { tether, proposal } = await seedProgressScene();
    actAs(OWNER_ID);

    const res = await POST(
      createProposal({
        id: proposal.id,
        tether_id: tether.id,
        status: TetherProposalStatus.Cancel,
      })
    );

    expect(res).toEqual({
      result: true,
      message: ToastData.threadProposalCancel,
    });

    const updated = await db.tether_proposal.findFirst({
      where: { id: proposal.id },
    });
    expect(updated.reason).toBe("owner");

    const proposer = await db.user.findFirst({ where: { id: PROPOSER_ID } });
    expect(proposer.trade_joined).toBe(0);

    expect(sendWebpushMock).toHaveBeenCalledTimes(1);
    const [, users] = sendWebpushMock.mock.calls[0];
    expect(users.map((u: any) => u.id).sort()).toEqual(
      [OWNER_ID, PROPOSER_ID].sort()
    );
  });
});
