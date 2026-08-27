// Phase 2 integration tests for P2P trade rating
// (src/app/api/tethers/proposal/rate/update/index.ts).
//
// prismock backs the real handleConnect + $transaction (no rollback semantics
// — only committed outcomes are asserted). serverFunctions, rank evaluation
// and leaderboard side effects are stubbed; the rating math, exactly-once
// completion gate and both notification paths run for real.
jest.mock("../../../../../helpers/server/prismaClient", () => {
  const { PrismockClient } = require("prismock");
  return { prisma: new PrismockClient() };
});

jest.mock("../../../../../helpers/server/serverFunctions", () => ({
  RequestValidator: { User: "user", Admin: "admin" },
  requestValidator: jest.fn(),
  sendWebpush: jest.fn(),
  makeMessagePayload: jest.fn((args: any) => args),
  webPushUserSelect: {
    id: true,
    push_token: true,
    profile: { select: { displayname: true } },
    settings: { select: { key: true, value: true } },
  },
}));

jest.mock("../../../../../helpers/server/rankEvaluator", () => ({
  evaluateRankLevel: jest.fn(async () => ({
    rank_level: 2,
    name: "실버",
    badge_image: "silver.png",
  })),
}));

jest.mock("../../../../../helpers/server/leaderboardService", () => ({
  upsertLeaderboardEntries: jest.fn(),
  refreshAllLeaderboardCaches: jest.fn(),
  broadcastLeaderboardUpdate: jest.fn(),
}));

import { prisma } from "../../../../../helpers/server/prismaClient";
import {
  requestValidator,
  sendWebpush,
} from "../../../../../helpers/server/serverFunctions";
import {
  upsertLeaderboardEntries,
  refreshAllLeaderboardCaches,
  broadcastLeaderboardUpdate,
} from "../../../../../helpers/server/leaderboardService";
import { POST } from "@/app/api/tethers/proposal/rate/update";
import { ToastData } from "@/helpers/toastData";
import {
  AlarmTypes,
  TetherStatus,
  TetherProposalStatus,
} from "@/helpers/types";
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

const rate = (over: Record<string, unknown> = {}) =>
  ({
    id: 0,
    tether_proposal_id: 1,
    rate: 5,
    ...over,
  }) as any;

// Owner + proposer with distinct trade history (to verify the weighted
// average), a progress-tether and one open proposal on it.
const seedRatableTrade = async () => {
  const tether = await seedTradeScene(db, { status: TetherStatus.Progress });
  await seedUser(db, { id: OUTSIDER_ID });
  await db.user.update({
    where: { id: OWNER_ID },
    data: { trade_count: 4, trade_rate: 4 },
  });
  await db.user.update({
    where: { id: PROPOSER_ID },
    data: { trade_count: 1, trade_rate: 3 },
  });
  const proposal = await seedProposal(db, {
    tether_id: tether.id,
    user_id: PROPOSER_ID,
  });
  return { tether, proposal };
};

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

describe("rating — validation and guards", () => {
  it("rejects a non-numeric rate", async () => {
    actAs(OWNER_ID);

    const res = await POST(rate({ rate: undefined }));

    expect(res).toEqual({ result: false, message: String(ToastData.unknown) });
  });

  it("rejects updates to an existing rating (immutable)", async () => {
    actAs(OWNER_ID);

    const res = await POST(rate({ id: 7 }));

    expect(res).toEqual({ result: false, message: String(ToastData.unknown) });
  });

  it("rejects an unknown proposal", async () => {
    actAs(OWNER_ID);

    const res = await POST(rate({ tether_proposal_id: 999 }));

    expect(res).toEqual({ result: false, message: String(ToastData.unknown) });
  });

  it("rejects rating on a cancelled tether", async () => {
    const { proposal } = await seedRatableTrade();
    await db.tether.updateMany({ data: { status: TetherStatus.Cancel } });
    actAs(OWNER_ID);

    const res = await POST(rate({ tether_proposal_id: proposal.id }));

    expect(res).toEqual({
      result: false,
      message: String(ToastData.tetherAlreadyCancel),
    });
  });

  it("rejects rating on a completed tether", async () => {
    const { proposal } = await seedRatableTrade();
    await db.tether.updateMany({ data: { status: TetherStatus.Complete } });
    actAs(OWNER_ID);

    const res = await POST(rate({ tether_proposal_id: proposal.id }));

    expect(res).toEqual({
      result: false,
      message: String(ToastData.tetherAlreadyComplete),
    });
  });

  it("rejects a rater who is not part of the trade", async () => {
    const { proposal } = await seedRatableTrade();
    actAs(OUTSIDER_ID);

    const res = await POST(rate({ tether_proposal_id: proposal.id }));

    expect(res).toEqual({ result: false, message: String(ToastData.unknown) });
  });

  it("rejects a second rating from the same user", async () => {
    const { proposal } = await seedRatableTrade();
    actAs(OWNER_ID);
    await POST(rate({ tether_proposal_id: proposal.id, rate: 5 }));

    const res = await POST(rate({ tether_proposal_id: proposal.id, rate: 1 }));

    expect(res).toEqual({ result: false, message: String(ToastData.unknown) });
    expect(await db.tether_rate.findMany({})).toHaveLength(1);
  });
});

describe("rating — first rater", () => {
  it("stores the rating, leaves the trade open and nudges the other party", async () => {
    const { tether, proposal } = await seedRatableTrade();
    actAs(OWNER_ID);

    const res = await POST(rate({ tether_proposal_id: proposal.id, rate: 5 }));

    expect(res).toEqual({
      result: true,
      message: ToastData.threadProposalRateCreate,
    });

    const rates = await db.tether_rate.findMany({});
    expect(rates).toHaveLength(1);
    expect(rates[0]).toMatchObject({ user_id: OWNER_ID, rate: 5 });

    // Not finalized: tether/proposal untouched, no counter changes.
    const tetherRow = await db.tether.findFirst({ where: { id: tether.id } });
    expect(tetherRow.status).toBe(TetherStatus.Progress);
    const owner = await db.user.findFirst({ where: { id: OWNER_ID } });
    expect(owner.trade_count).toBe(4);

    // Rate-prompt push goes to the proposer (the party that hasn't rated).
    expect(sendWebpushMock).toHaveBeenCalledTimes(1);
    const [payloads, users] = sendWebpushMock.mock.calls[0];
    expect(payloads[0].type).toBe(AlarmTypes.P2PRateRequest);
    expect(users.map((u: any) => u.id)).toEqual([PROPOSER_ID]);
    expect(refreshAllLeaderboardCaches).not.toHaveBeenCalled();
  });
});

describe("rating — second rater finalizes the trade", () => {
  const finalize = async () => {
    const { tether, proposal } = await seedRatableTrade();
    actAs(OWNER_ID); // owner rates the proposer 5
    await POST(rate({ tether_proposal_id: proposal.id, rate: 5 }));
    sendWebpushMock.mockClear();
    actAs(PROPOSER_ID); // proposer rates the owner 4
    const res = await POST(rate({ tether_proposal_id: proposal.id, rate: 4 }));
    return { tether, proposal, res };
  };

  it("completes the tether and the proposal", async () => {
    const { tether, proposal, res } = await finalize();

    expect(res).toEqual({
      result: true,
      message: ToastData.threadProposalRateCreate,
    });
    const tetherRow = await db.tether.findFirst({ where: { id: tether.id } });
    expect(tetherRow.status).toBe(TetherStatus.Complete);
    const proposalRow = await db.tether_proposal.findFirst({
      where: { id: proposal.id },
    });
    expect(proposalRow.status).toBe(TetherProposalStatus.Complete);
  });

  it("updates both parties' running averages with the rating from the OTHER party", async () => {
    await finalize();

    // Owner: had 4 trades at avg 4.0, receives the proposer's 4 →
    // (4*4.0 + 4) / 5 = 4.0; count 5.
    const owner = await db.user.findFirst({ where: { id: OWNER_ID } });
    expect(owner.trade_count).toBe(5);
    expect(Number(owner.trade_rate)).toBeCloseTo(4.0);

    // Proposer: had 1 trade at avg 3.0, receives the owner's 5 →
    // (1*3.0 + 5) / 2 = 4.0; count 2.
    const proposer = await db.user.findFirst({ where: { id: PROPOSER_ID } });
    expect(proposer.trade_count).toBe(2);
    expect(Number(proposer.trade_rate)).toBeCloseTo(4.0);
  });

  it("applies the evaluated rank to both profiles", async () => {
    await finalize();

    for (const uid of [OWNER_ID, PROPOSER_ID]) {
      const profile = await db.profile.findFirst({ where: { uid } });
      expect(profile).toMatchObject({
        current_rank_level: 2,
        current_rank_name: "실버",
        current_rank_image: "silver.png",
      });
    }
  });

  it("notifies both parties of completion and refreshes the leaderboard", async () => {
    await finalize();

    expect(sendWebpushMock).toHaveBeenCalledTimes(1);
    const [payloads, users] = sendWebpushMock.mock.calls[0];
    expect(payloads).toHaveLength(2);
    expect(payloads.every((p: any) => p.type === AlarmTypes.P2PComplete)).toBe(
      true
    );
    expect(users.map((u: any) => u.id).sort()).toEqual(
      [OWNER_ID, PROPOSER_ID].sort()
    );

    expect(upsertLeaderboardEntries).toHaveBeenCalledTimes(2);
    expect(refreshAllLeaderboardCaches).toHaveBeenCalledTimes(1);
    expect(broadcastLeaderboardUpdate).toHaveBeenCalledTimes(1);
  });
});
