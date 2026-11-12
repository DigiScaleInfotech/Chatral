// Shopify customer lookup for the inbox (customer + last order), per store. The Admin API token is
// stored encrypted (ENC_KEY) and never returned to the browser. Only *.myshopify.com hosts are
// called, so a saved domain cannot be used to make the server request arbitrary URLs.
import { encryptJson, decryptJson } from '../lib/crypto.js';
import { httpError } from '../lib/util.js';

export const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-07';
const DOMAIN = /^[a-z0-9][a-z0-9-]{0,60}\.myshopify\.com$/;

export function normalizeShopDomain(raw) {
  const host = String(raw || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!DOMAIN.test(host)) throw httpError(400, "Enter your store's .myshopify.com domain (e.g. my-shop.myshopify.com)");
  return host;
}

export const shopifyConnected = (store) => !!(store.shopifyDomain && store.shopifyToken);
export const sealToken = (token) => encryptJson({ token });
const tokenOf = (store) => { try { return decryptJson(store.shopifyToken).token; } catch { return null; } };

async function gql(store, query, variables = {}) {
  const token = tokenOf(store);
  if (!store.shopifyDomain || !token) throw httpError(409, 'Shopify is not connected for this store');
  let res;
  try {
    res = await fetch(`https://${store.shopifyDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw httpError(502, 'Could not reach Shopify. Please try again.');
  }
  if (res.status === 401 || res.status === 403) throw httpError(502, 'Shopify rejected the access token. Check the token and its scopes (read_customers, read_orders).');
  if (!res.ok) throw httpError(502, `Shopify returned an error (HTTP ${res.status})`);
  const body = await res.json();
  if (body.errors?.length) throw httpError(502, `Shopify: ${body.errors[0].message}`);
  return body.data;
}

export async function testShopify(store) {
  const d = await gql(store, 'query { shop { name myshopifyDomain } }');
  return { name: d.shop.name, domain: d.shop.myshopifyDomain };
}

// Validated against Admin GraphQL 2026-07 (scopes: read_customers, read_orders).
const CUSTOMER_QUERY = `query CustomerLastOrder($q: String!) {
  customers(first: 1, query: $q) { nodes {
    id legacyResourceId displayName defaultEmailAddress { emailAddress } defaultPhoneNumber { phoneNumber }
    createdAt numberOfOrders amountSpent { amount currencyCode } tags state
    lastOrder { id legacyResourceId name createdAt displayFinancialStatus displayFulfillmentStatus
      totalPriceSet { shopMoney { amount currencyCode } } lineItems(first: 10) { nodes { title quantity } } }
  } }
}`;

/** Customer (and their last order) with this exact email, or null. */
export async function findCustomer(store, email) {
  const clean = String(email || '').trim().toLowerCase();
  if (!/^[^\s@"\\]+@[^\s@"\\]+\.[^\s@"\\]+$/.test(clean)) throw httpError(400, 'Enter a valid email address');
  const d = await gql(store, CUSTOMER_QUERY, { q: `email:"${clean}"` });
  const c = d.customers.nodes[0];
  if (!c) return null;
  const admin = `https://admin.shopify.com/store/${store.shopifyDomain.replace('.myshopify.com', '')}`;
  const o = c.lastOrder;
  return {
    name: c.displayName, email: c.defaultEmailAddress?.emailAddress || clean, phone: c.defaultPhoneNumber?.phoneNumber || null,
    createdAt: c.createdAt, ordersCount: Number(c.numberOfOrders || 0), amountSpent: c.amountSpent, tags: c.tags, state: c.state,
    adminUrl: `${admin}/customers/${c.legacyResourceId}`,
    lastOrder: o ? {
      name: o.name, createdAt: o.createdAt, financialStatus: o.displayFinancialStatus, fulfillmentStatus: o.displayFulfillmentStatus,
      total: o.totalPriceSet?.shopMoney, items: (o.lineItems?.nodes || []).map((li) => ({ title: li.title, quantity: li.quantity })),
      adminUrl: `${admin}/orders/${o.legacyResourceId}`,
    } : null,
  };
}
