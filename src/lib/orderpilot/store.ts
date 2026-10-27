import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { buildDemo } from "./presets";
import type { Business, Enquiry, PriceItem } from "./types";

type OrderState = {
  business: Business;
  prices: PriceItem[];
  enquiries: Enquiry[];
  introDismissed: boolean;
  pendingFocusId: string | null;
  setBusiness: (patch: Partial<Business>) => void;
  setPrices: (prices: PriceItem[]) => void;
  upsertPrice: (item: PriceItem) => void;
  removePrice: (id: string) => void;
  addEnquiry: (enquiry: Enquiry) => void;
  replaceEnquiry: (enquiry: Enquiry) => void;
  removeEnquiry: (id: string) => void;
  replaceAll: (next: { business: Business; prices: PriceItem[]; enquiries: Enquiry[] }) => void;
  dismissIntro: () => void;
  clearPending: () => void;
};

const demo = buildDemo();

export const useOrderPilot = create<OrderState>()(
  persist(
    (set) => ({
      business: demo.business,
      prices: demo.prices,
      enquiries: demo.enquiries,
      introDismissed: false,
      pendingFocusId: null,
      setBusiness: (patch) => set((state) => ({
        business: { ...state.business, ...patch },
        ...(patch.currency && patch.currency !== state.business.currency ? { enquiries: state.enquiries.map(item => ({ ...item, currency: item.currency ?? state.business.currency })) } : {}),
      })),
      setPrices: (prices) => set({ prices }),
      upsertPrice: (item) =>
        set((state) => ({
          prices: state.prices.some((price) => price.id === item.id)
            ? state.prices.map((price) => (price.id === item.id ? item : price))
            : [...state.prices, item],
        })),
      removePrice: (id) =>
        set((state) => ({ prices: state.prices.filter((price) => price.id !== id) })),
      addEnquiry: (enquiry) =>
        set((state) => ({
          enquiries: [enquiry, ...state.enquiries],
          pendingFocusId: enquiry.id,
        })),
      replaceEnquiry: (enquiry) =>
        set((state) => ({
          enquiries: state.enquiries.map((current) => (current.id === enquiry.id ? enquiry : current)),
        })),
      removeEnquiry: (id) =>
        set((state) => ({ enquiries: state.enquiries.filter((enquiry) => enquiry.id !== id) })),
      replaceAll: (next) => set({ ...next, pendingFocusId: null }),
      dismissIntro: () => set({ introDismissed: true }),
      clearPending: () => set({ pendingFocusId: null }),
    }),
    {
      name: "orderpilot-v1",
      partialize: (state) => ({
        business: state.business,
        prices: state.prices,
        enquiries: state.enquiries,
        introDismissed: state.introDismissed,
      }),
    },
  ),
);

export function useOrderPilotHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const finish = () => setHydrated(true);
    const unsub = useOrderPilot.persist.onFinishHydration(finish);
    if (useOrderPilot.persist.hasHydrated()) finish();
    return unsub;
  }, []);
  return hydrated;
}
