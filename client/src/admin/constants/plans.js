import { useState, useEffect } from 'react';

/**
 * Shared Subscription Plans & Pricing Configuration
 * Single Source of Truth across Landing Page, Settings Dashboard, and Billing.
 */
export const DEFAULT_PLAN_PRICING = {
  STARTER: {
    name: 'Starter Growth',
    monthlyPriceINR: 599,
    annualPriceINR: 6100,
    monthlyPriceUSD: 6,
    annualPriceUSD: 61,
  },
  BUSINESS: {
    name: 'Enterprise (Custom Plan)',
    monthlyPriceINR: 999,
    annualPriceINR: 8988, // ₹749 / mo
    monthlyPriceUSD: 12,
    annualPriceUSD: 108, // $9 / mo
  },
};

let cachedPlans = { ...DEFAULT_PLAN_PRICING };
let fetchPromise = null;

export function fetchLivePlans() {
  if (!fetchPromise) {
    const baseUrl =
      typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
        : '';
    fetchPromise = fetch(`${baseUrl}/api/billing/plans`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.plans) {
          cachedPlans = data.plans;
        }
        return cachedPlans;
      })
      .catch(() => cachedPlans);
  }
  return fetchPromise;
}

/**
 * Hook to read reactive subscription plan pricing.
 * Automatically synchronizes with the backend pricing endpoint.
 */
export function usePlanPricing() {
  const [plans, setPlans] = useState(cachedPlans);

  useEffect(() => {
    fetchLivePlans().then((p) => {
      if (p) setPlans({ ...p });
    });
  }, []);

  return plans;
}

