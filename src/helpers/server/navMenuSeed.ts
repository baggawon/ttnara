import { handleConnect } from "./prisma";

export type NavMenuKind = "link" | "home" | "chat_toggle";

const TOP_SEED: Array<{
  label: string;
  url: string;
  is_external?: boolean;
  children?: Array<{ label: string; url: string; is_external?: boolean }>;
}> = [
  { label: "공식보증업체", url: "/guarantee" },
  { label: "P2P 거래", url: "/board/tether" },
  { label: "자유홍보", url: "/board/promotion" },
  {
    label: "공지사항",
    url: "",
    children: [
      { label: "공지사항", url: "/board/notice" },
      { label: "이용안내", url: "/board/guide" },
      { label: "고객센터", url: "https://t.me/ttnara114", is_external: true },
      { label: "랭킹", url: "/leaderboard" },
      { label: "이벤트", url: "/board/event" },
    ],
  },
  {
    label: "커뮤니티",
    url: "",
    children: [
      { label: "자유게시판", url: "/board/freedom" },
      { label: "테더뉴스", url: "/board/tether_news" },
      { label: "정보공유", url: "/board/tips" },
      { label: "익명게시판", url: "/board/anon" },
    ],
  },
  { label: "거래신고", url: "/board/trade_report" },
];

const MOBILE_LINK_SEED: Array<{ label: string; url: string; icon: string }> = [
  { label: "P2P 거래", url: "/board/tether", icon: "DollarSign" },
  { label: "정보공유", url: "/board/tips", icon: "Lightbulb" },
  { label: "공식보증업체", url: "/guarantee", icon: "Newspaper" },
];

// Module-level promise to deduplicate concurrent cold-start callers.
// Without this, parallel hits to /api/partners/list, /api/signup/read, etc.
// could each see count===0 and double-seed.
let seedPromise: Promise<void> | null = null;

const runSeed = async () => {
  // ─── Top surface ───────────────────────────────────────────────
  const topCount = await handleConnect((prisma) =>
    prisma.nav_menu_item.count({ where: { surface: "top" } })
  );
  if ((topCount ?? 0) === 0) {
    for (let i = 0; i < TOP_SEED.length; i++) {
      const item = TOP_SEED[i];
      const parent = await handleConnect((prisma) =>
        prisma.nav_menu_item.create({
          data: {
            surface: "top",
            kind: "link",
            label: item.label,
            url: item.url,
            is_external: !!item.is_external,
            display_order: i + 1,
          },
        })
      );
      if (parent && item.children?.length) {
        for (let j = 0; j < item.children.length; j++) {
          const child = item.children[j];
          await handleConnect((prisma) =>
            prisma.nav_menu_item.create({
              data: {
                surface: "top",
                kind: "link",
                parent_id: parent.id,
                label: child.label,
                url: child.url,
                is_external: !!child.is_external,
                display_order: j + 1,
              },
            })
          );
        }
      }
    }
  }

  // ─── Mobile bottom surface ─────────────────────────────────────
  const mobileLinkCount = await handleConnect((prisma) =>
    prisma.nav_menu_item.count({
      where: { surface: "mobile_bottom", kind: "link" },
    })
  );
  if ((mobileLinkCount ?? 0) === 0) {
    for (let i = 0; i < MOBILE_LINK_SEED.length; i++) {
      const item = MOBILE_LINK_SEED[i];
      await handleConnect((prisma) =>
        prisma.nav_menu_item.create({
          data: {
            surface: "mobile_bottom",
            kind: "link",
            label: item.label,
            url: item.url,
            icon: item.icon,
            // links sit between home (display_order=0) and chat_toggle (=9999)
            // we resequence after to make it 1..N
            display_order: i + 1,
          },
        })
      );
    }
  }

  // System items (home, chat_toggle): ensure exactly one of each. Idempotent
  // for both fresh installs and existing installs that predate this field.
  await ensureSystemMobileItems();
};

const ensureSystemMobileItems = async () => {
  const home = await handleConnect((prisma) =>
    prisma.nav_menu_item.findFirst({
      where: { surface: "mobile_bottom", kind: "home" },
    })
  );
  if (!home) {
    await handleConnect((prisma) =>
      prisma.nav_menu_item.create({
        data: {
          surface: "mobile_bottom",
          kind: "home",
          label: "홈",
          url: "/",
          icon: "Home",
          display_order: 0, // sorts before existing links
        },
      })
    );
  }
  const chat = await handleConnect((prisma) =>
    prisma.nav_menu_item.findFirst({
      where: { surface: "mobile_bottom", kind: "chat_toggle" },
    })
  );
  if (!chat) {
    await handleConnect((prisma) =>
      prisma.nav_menu_item.create({
        data: {
          surface: "mobile_bottom",
          kind: "chat_toggle",
          label: "채팅",
          url: "",
          icon: "MessageCircle",
          display_order: 9999, // sorts after existing links
        },
      })
    );
  }

  // Resequence display_order to a clean 1..N if we just inserted a system item
  // with the sentinel 0 / 9999 values, so ordering reads stay tidy.
  if (!home || !chat) {
    const all = await handleConnect((prisma) =>
      prisma.nav_menu_item.findMany({
        where: { surface: "mobile_bottom", parent_id: null },
        orderBy: { display_order: "asc" },
      })
    );
    if (all) {
      for (let i = 0; i < all.length; i++) {
        const expected = i + 1;
        if (all[i].display_order !== expected) {
          await handleConnect((prisma) =>
            prisma.nav_menu_item.update({
              where: { id: all[i].id },
              data: { display_order: expected },
            })
          );
        }
      }
    }
  }
};

export const seedNavMenuIfEmpty = async () => {
  if (seedPromise) return seedPromise;
  seedPromise = runSeed().catch((err) => {
    // If the seed fails, allow the next caller to retry rather than caching the failure.
    seedPromise = null;
    throw err;
  });
  return seedPromise;
};
