import { PAGESIZES, version } from "@/helpers/config";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Loading {
  loading: number;
  setLoading: () => void;
  disableLoading: () => void;
  clearLoading: () => void;
}

export const useLoadingStore = create<Loading>((set) => ({
  loading: 0,
  setLoading: () => set(({ loading }) => ({ loading: loading + 1 })),
  disableLoading: () =>
    set(({ loading }) => ({ loading: loading > 0 ? loading - 1 : 0 })),
  clearLoading: () => set(() => ({ loading: 0 })),
}));

export type PageSizeNames = "dashboard" | "modal" | "reference";
type Pagesizes = {
  [key in PageSizeNames]: number;
};

interface Settings {
  version: string;
  PAGESIZES: Pagesizes;
  accountType: string;
  limit: {
    read: number;
  };
  changePAGESIZES: ({
    PAGESIZE,
    pageName,
  }: {
    PAGESIZE: number;
    pageName: string;
  }) => void;
}

export const useSettingsStore = create(
  persist<Settings>(
    (set) => ({
      version,
      PAGESIZES: {
        dashboard: PAGESIZES[1]!,
        reference: PAGESIZES[1]!,
        modal: PAGESIZES[0]!,
      },
      accountType: "normal",
      limit: {
        read: 20,
      },
      changePAGESIZES: ({ PAGESIZE, pageName }) =>
        set((prev) => ({
          ...prev,
          PAGESIZES: {
            ...prev.PAGESIZES,
            [pageName]: PAGESIZE,
          },
        })),
    }),
    { name: "settings" }
  )
);

interface VersionModal {
  open: boolean;
  openRequest: () => void;
  resetRequest: () => void;
}

export const useVersionStore = create<VersionModal>((set) => ({
  open: false,
  openRequest: () =>
    set(({ open }) => ({ open: open === false ? true : open })),
  resetRequest: () => set(() => ({ open: false })),
}));

interface AdminMode {
  on: boolean;
  SetOn: () => void;
  SetOff: () => void;
}

export const useAdminModeStore = create<AdminMode>((set) => ({
  on: false,
  SetOn: () => set(() => ({ on: true })),
  SetOff: () => set(() => ({ on: false })),
}));

interface SessionSubscribe {
  needLogout: boolean;
  loginRequest: () => void;
  logoutRequest: () => void;
}

export const useSessionStore = create<SessionSubscribe>((set) => ({
  needLogout: false,
  loginRequest: () => set(() => ({ needLogout: false })),
  logoutRequest: () => set(() => ({ needLogout: true })),
}));
