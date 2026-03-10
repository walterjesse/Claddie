import emailjs from "@emailjs/browser";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent, ReactNode } from "react";

// supabase client initialized from environment variables
import { supabase } from "./lib/supabase";

type Page = "home" | "shop" | "admin";
type AdminStage = "quiz" | "password" | "dashboard";
type AdminTab = "inventory" | "orders" | "messages" | "accounts" | "settings";
type SortMode = "newest" | "low-stock" | "category";
type OrderStatus = "Pending payment" | "Payment confirmed" | "Preparing order" | "Out for delivery" | "Delivered";

type Product = {
  id: string;
  name: string;
  audience: string;
  shoeType: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  sizes: string[];
  colors: string[];
  images: string[];
  instagramUrl: string;
  featured: boolean;
  createdAt: string;
};

type ProductFormState = {
  name: string;
  audience: string;
  shoeType: string;
  category: string;
  description: string;
  price: string;
  stock: string;
  sizes: string;
  colors: string;
  instagramUrl: string;
  featured: boolean;
  images: string[];
};

type ProductSelection = {
  size: string;
  color: string;
  quantity: number;
  imageIndex: number;
};

type CartItem = {
  productId: string;
  size: string;
  color: string;
  quantity: number;
};

type CheckoutFormState = {
  name: string;
  phone: string;
  location: string;
  notes: string;
};

type OrderLine = {
  productId: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type Order = {
  id: string;
  reference: string;
  invoiceReference: string;
  createdAt: string;
  status: OrderStatus;
  customer: CheckoutFormState;
  items: OrderLine[];
  total: number;
  userId?: string;
};

type Invoice = {
  id: string;
  reference: string;
  orderReference: string;
  createdAt: string;
  customer: CheckoutFormState;
  items: OrderLine[];
  total: number;
};

type UserAccount = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  createdAt: string;
};

type PasswordResetRequest = {
  email: string;
  code: string;
  expiresAt: string;
};

type Message = {
  id: string;
  threadId: string;
  senderType: "customer" | "admin";
  senderName: string;
  customerLabel: string;
  orderReference: string;
  message: string;
  createdAt: string;
};

type Settings = {
  adminPassword: string;
  adminQuizQuestion: string;
  adminQuizAnswer: string;
  emailjsServiceId: string;
  emailjsTemplateId: string;
  emailjsPublicKey: string;
  paybillNumber: string;
  paybillAccountName: string;
  paybillReferencePrefix: string;
  businessPhone: string;
  businessLocation: string;
  businessHours: string;
  aboutText: string;
};

const PRODUCT_KEY = "claddie-products";
const ORDER_KEY = "claddie-orders";
const INVOICE_KEY = "claddie-invoices";
const USER_KEY = "claddie-users";
const SETTINGS_KEY = "claddie-settings";
const CART_KEY = "claddie-cart";
const MESSAGE_KEY = "claddie-messages";
const USER_SESSION_KEY = "claddie-user-session";
const GUEST_THREAD_KEY = "claddie-guest-thread";
const LAST_ORDER_KEY = "claddie-last-order";
const ADMIN_QUIZ_KEY = "claddie-admin-quiz-passed";
const ADMIN_AUTH_KEY = "claddie-admin-authenticated";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1800&q=80";

const INPUT_CLASS =
  "h-12 w-full rounded-full border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-orange-500";
const TEXTAREA_CLASS =
  "min-h-28 w-full rounded-[1.75rem] border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-orange-500";
const PANEL_CLASS = "rounded-[2rem] border border-stone-200 bg-white shadow-sm";

const ORDER_STATUSES: OrderStatus[] = [
  "Pending payment",
  "Payment confirmed",
  "Preparing order",
  "Out for delivery",
  "Delivered",
];

const DEFAULT_SETTINGS: Settings = {
  adminPassword: "Junior",
  adminQuizQuestion: "Is it you..?",
  adminQuizAnswer: "Junior",
  emailjsServiceId: "",
  emailjsTemplateId: "",
  emailjsPublicKey: "",
  paybillNumber: "247247",
  paybillAccountName: "Claddie KENYA",
  paybillReferencePrefix: "CK",
  businessPhone: "+254 700 000 000",
  businessLocation: "Nairobi, Kenya",
  businessHours: "Monday to Saturday, 8:00 AM - 7:00 PM",
  aboutText:
    "Claddie KENYA is a Nairobi shoe shop trusted for stylish family footwear, fair pricing, quality pairs, and reliable delivery.",
};

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "city-stride-sneaker",
    name: "City Stride Sneaker",
    audience: "Men",
    shoeType: "Sneaker",
    category: "Casual",
    description: "Clean everyday sneakers with soft cushioning and easy styling for busy Nairobi days.",
    price: 2900,
    stock: 14,
    sizes: ["40", "41", "42", "43", "44"],
    colors: ["White", "Black", "Red"],
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1605348532760-6753d2c43329?auto=format&fit=crop&w=1200&q=80",
    ],
    instagramUrl: "",
    featured: true,
    createdAt: new Date("2024-12-16T09:00:00Z").toISOString(),
  },
  {
    id: "nairobi-classic-heel",
    name: "Nairobi Classic Heel",
    audience: "Women",
    shoeType: "Heel",
    category: "Occasion",
    description: "Elegant heels designed for polished office looks, special events, and confident evenings.",
    price: 3200,
    stock: 10,
    sizes: ["36", "37", "38", "39", "40"],
    colors: ["Black", "Nude", "Wine"],
    images: [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?auto=format&fit=crop&w=1200&q=80",
    ],
    instagramUrl: "",
    featured: true,
    createdAt: new Date("2024-12-17T09:00:00Z").toISOString(),
  },
  {
    id: "ridge-safari-boot",
    name: "Ridge Safari Boot",
    audience: "Men",
    shoeType: "Boot",
    category: "Safari",
    description: "Durable safari boots built for travel, long wear, and a smart outdoor finish.",
    price: 4900,
    stock: 7,
    sizes: ["41", "42", "43", "44", "45"],
    colors: ["Brown", "Tan", "Black"],
    images: [
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1608256246200-53e8b47b2f80?auto=format&fit=crop&w=1200&q=80",
    ],
    instagramUrl: "",
    featured: true,
    createdAt: new Date("2024-12-18T09:00:00Z").toISOString(),
  },
  {
    id: "soft-office-flat",
    name: "Soft Office Flat",
    audience: "Women",
    shoeType: "Flat",
    category: "Office",
    description: "Simple office flats that stay comfortable through busy schedules and quick errands.",
    price: 2500,
    stock: 12,
    sizes: ["36", "37", "38", "39", "40", "41"],
    colors: ["Black", "Cream", "Tan"],
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1463100099107-aa0980c362e6?auto=format&fit=crop&w=1200&q=80",
    ],
    instagramUrl: "",
    featured: false,
    createdAt: new Date("2024-12-19T09:00:00Z").toISOString(),
  },
];

const EMPTY_PRODUCT_FORM: ProductFormState = {
  name: "",
  audience: "Women",
  shoeType: "Sneaker",
  category: "Casual",
  description: "",
  price: "",
  stock: "",
  sizes: "36, 37, 38, 39",
  colors: "Black, White",
  instagramUrl: "",
  featured: false,
  images: [],
};

const EMPTY_CHECKOUT: CheckoutFormState = {
  name: "",
  phone: "",
  location: "",
  notes: "",
};

function cls(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function readStorage<T>(key: string, fallback: T) {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function readSession(key: string) {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(key) === "true";
}

function writeSession(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  if (value) window.sessionStorage.setItem(key, "true");
  else window.sessionStorage.removeItem(key);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

function makeReference(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 5).toUpperCase()}${Date.now().toString().slice(-4)}`;
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getPath() {
  if (typeof window === "undefined") return "/";
  const route = new URLSearchParams(window.location.search).get("route");
  if (route?.startsWith("/")) return route;
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function getPageFromLocation(): Page {
  const path = getPath();
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/shop")) return "shop";
  return "home";
}

function navigate(page: Page) {
  if (typeof window === "undefined") return;
  const route = page === "home" ? "/" : `/${page}`;
  const url = page === "home" ? "/" : `/?route=${encodeURIComponent(route)}`;
  window.history.pushState({}, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read image file"));
    reader.readAsDataURL(file);
  });
}

function createSelection(product: Product): ProductSelection {
  return {
    size: product.sizes[0] || "",
    color: product.colors[0] || "",
    quantity: 1,
    imageIndex: 0,
  };
}

function createInvoice(order: Order): Invoice {
  return {
    id: `invoice-${order.id}`,
    reference: order.invoiceReference,
    orderReference: order.reference,
    createdAt: order.createdAt,
    customer: order.customer,
    items: order.items,
    total: order.total,
  };
}

function canSendResetEmails(settings: Settings) {
  return Boolean(settings.emailjsServiceId.trim() && settings.emailjsTemplateId.trim() && settings.emailjsPublicKey.trim());
}

async function sendResetEmail(settings: Settings, user: UserAccount, request: PasswordResetRequest) {
  await emailjs.send(
    settings.emailjsServiceId.trim(),
    settings.emailjsTemplateId.trim(),
    {
      to_email: user.email,
      to_name: user.name,
      customer_name: user.name,
      reset_code: request.code,
      expires_at: new Date(request.expiresAt).toLocaleString(),
      store_name: "Claddie KENYA",
      support_phone: settings.businessPhone,
    },
    {
      publicKey: settings.emailjsPublicKey.trim(),
    },
  );
}

function buildInvoiceText(invoice: Invoice, settings: Settings, status: OrderStatus) {
  return [
    "CLADDIE KENYA",
    `Invoice: ${invoice.reference}`,
    `Order: ${invoice.orderReference}`,
    `Status: ${status}`,
    `Date: ${new Date(invoice.createdAt).toLocaleString()}`,
    "",
    `Customer: ${invoice.customer.name}`,
    `Phone: ${invoice.customer.phone}`,
    `Delivery area: ${invoice.customer.location}`,
    "",
    ...invoice.items.map(
      (item) => `${item.name} | ${item.color} | Size ${item.size} | Qty ${item.quantity} | ${formatCurrency(item.lineTotal)}`,
    ),
    "",
    `Total: ${formatCurrency(invoice.total)}`,
    `Paybill number: ${settings.paybillNumber}`,
    `Account name: ${settings.paybillAccountName}`,
    `Reference: ${settings.paybillReferencePrefix}-${invoice.orderReference}`,
  ].join("\n");
}

function printInvoice(invoice: Invoice, settings: Settings, status: OrderStatus) {
  if (typeof window === "undefined") return;
  const popup = window.open("", "_blank", "width=960,height=760");
  if (!popup) return;
  popup.document.write(`
    <html>
      <head>
        <title>${invoice.reference}</title>
        <style>
          *{box-sizing:border-box}body{margin:0;background:#f5f5f4;padding:32px;font-family:Arial,sans-serif;color:#1c1917}
          .page{max-width:860px;margin:0 auto;background:#fff;border:1px solid #e7e5e4;border-radius:42px;padding:40px}
          .eyebrow{font-size:11px;font-weight:700;letter-spacing:.32em;text-transform:uppercase;color:#f97316}
          .brand{margin-top:12px;font-size:34px;font-weight:800;letter-spacing:.16em}
          .lead{color:#57534e;line-height:1.7}
          .status{display:inline-block;margin-top:18px;border-radius:999px;border:1px solid #d6d3d1;background:#fafaf9;padding:10px 16px;font-weight:700}
          .grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:28px}
          .panel{padding:18px 20px;border-radius:30px;border:1px solid #e7e5e4;background:#fafaf9}
          table{width:100%;border-collapse:collapse;margin-top:30px}
          th,td{padding:14px 0;border-bottom:1px solid #ece7e1;text-align:left}
          th{font-size:11px;text-transform:uppercase;letter-spacing:.2em;color:#78716c}
          .total{display:flex;justify-content:space-between;margin-top:24px;font-size:22px;font-weight:700}
          .note{margin-top:28px;padding:22px 24px;border-radius:30px;background:#111827;color:#fff;line-height:1.7}
        </style>
      </head>
      <body>
        <div class="page">
          <div class="eyebrow">Customer invoice</div>
          <div class="brand">CLADDIE KENYA</div>
          <p class="lead">Stylish, reliable footwear for the whole family, prepared in Nairobi with fair pricing and dependable service.</p>
          <div class="status">${status}</div>
          <div class="grid">
            <div class="panel"><strong>Invoice details</strong><p class="lead">Invoice: ${invoice.reference}<br/>Order: ${invoice.orderReference}<br/>Date: ${new Date(invoice.createdAt).toLocaleString()}</p></div>
            <div class="panel"><strong>Customer details</strong><p class="lead">${invoice.customer.name}<br/>${invoice.customer.phone}<br/>${invoice.customer.location}</p></div>
          </div>
          <div class="grid">
            <div class="panel"><strong>Payment details</strong><p class="lead">Paybill number: ${settings.paybillNumber}<br/>Account name: ${settings.paybillAccountName}<br/>Reference: ${settings.paybillReferencePrefix}-${invoice.orderReference}</p></div>
            <div class="panel"><strong>Thank you</strong><p class="lead">We appreciate your order. Keep this invoice for payment confirmation, delivery tracking, and easier repeat shopping.</p></div>
          </div>
          <table>
            <thead><tr><th>Item</th><th>Choice</th><th>Qty</th><th>Amount</th></tr></thead>
            <tbody>${invoice.items
              .map(
                (item) => `<tr><td>${item.name}</td><td>${item.color} / size ${item.size}</td><td>${item.quantity}</td><td>${formatCurrency(item.lineTotal)}</td></tr>`,
              )
              .join("")}</tbody>
          </table>
          <div class="total"><span>Total</span><span>${formatCurrency(invoice.total)}</span></div>
          <div class="note">Thank you for choosing Claddie KENYA. We look forward to serving you again with quality shoes, helpful service, and delivery you can trust.</div>
        </div>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
}

async function copyText(text: string, onDone: (value: boolean) => void) {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    onDone(false);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    onDone(true);
    window.setTimeout(() => onDone(false), 1400);
  } catch {
    onDone(false);
  }
}

function hideArenaBadge() {
  if (typeof window === "undefined") return () => {};
  const styleId = "claddie-hide-arena-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = [
      'a[href*="arena"]',
      'iframe[src*="arena"]',
      '[class*="arena"]',
      '[id*="arena"]',
      '[data-arena]',
    ]
      .map((selector) => `${selector}{display:none !important;visibility:hidden !important;pointer-events:none !important;}`)
      .join("");
    document.head.appendChild(style);
  }

  const conceal = (element: Element | null) => {
    if (!(element instanceof HTMLElement)) return;
    element.style.setProperty("display", "none", "important");
    element.style.setProperty("visibility", "hidden", "important");
    element.style.setProperty("pointer-events", "none", "important");
    element.setAttribute("aria-hidden", "true");
  };

  const hide = () => {
    document.querySelectorAll("a, button, div, aside, iframe, span, p").forEach((element) => {
      const text = (element.textContent || "").toLowerCase();
      const href = element instanceof HTMLAnchorElement ? element.href.toLowerCase() : "";
      if (!text.includes("built with arena") && !href.includes("arena")) return;
      conceal(element);
      conceal(element.parentElement);
      const fixedParent = element.parentElement?.parentElement;
      if (fixedParent instanceof HTMLElement) {
        const position = window.getComputedStyle(fixedParent).position;
        if (position === "fixed" || position === "sticky") conceal(fixedParent);
      }
    });
  };
  hide();
  const observer = new MutationObserver(() => hide());
  observer.observe(document.body, { childList: true, subtree: true });
  const interval = window.setInterval(hide, 1000);
  return () => {
    observer.disconnect();
    window.clearInterval(interval);
  };
}

function Field({ label, children, hint, dark = false }: { label: string; children: ReactNode; hint?: string; dark?: boolean }) {
  return (
    <label className={cls("grid gap-2 text-sm", dark ? "text-stone-200" : "text-stone-700")}>
      <span className="font-medium">{label}</span>
      {children}
      {hint ? <span className="text-xs text-stone-500">{hint}</span> : null}
    </label>
  );
}

function SectionTitle({ eyebrow, title, copy, invert = false }: { eyebrow: string; title: string; copy: string; invert?: boolean }) {
  return (
    <div>
      <p className={cls("text-xs font-semibold uppercase tracking-[0.34em]", invert ? "text-orange-300" : "text-orange-500")}>{eyebrow}</p>
      <h2 className={cls("mt-3 text-3xl font-semibold tracking-tight sm:text-4xl", invert ? "text-white" : "text-stone-950")}>{title}</h2>
      <p className={cls("mt-4 max-w-2xl text-sm leading-7 sm:text-base", invert ? "text-stone-300" : "text-stone-600")}>{copy}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const tone =
    status === "Delivered"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "Out for delivery"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : status === "Payment confirmed"
          ? "border-orange-200 bg-orange-50 text-orange-700"
          : "border-stone-200 bg-stone-100 text-stone-700";

  return <span className={cls("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", tone)}>{status}</span>;
}

function InvoicePanel({
  invoice,
  status,
  settings,
  copied,
  onCopy,
  onPrint,
}: {
  invoice: Invoice;
  status: OrderStatus;
  settings: Settings;
  copied: boolean;
  onCopy: () => void;
  onPrint: () => void;
}) {
  return (
    <div className="rounded-[2.5rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-orange-500">Customer invoice</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">CLADDIE KENYA</h3>
          <p className="mt-3 max-w-xl text-sm leading-7 text-stone-600">Stylish, reliable footwear for the whole family, delivered with care from Nairobi.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onCopy} className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-900 transition hover:border-stone-950">{copied ? "Copied" : "Copy invoice"}</button>
          <button type="button" onClick={onPrint} className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800">Print</button>
        </div>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-stone-200 bg-stone-50 p-5 text-sm leading-7 text-stone-600">
          <p className="font-semibold text-stone-950">Invoice details</p>
          <p className="mt-2">Invoice: {invoice.reference}</p>
          <p>Order: {invoice.orderReference}</p>
          <p>Date: {new Date(invoice.createdAt).toLocaleString()}</p>
          <div className="mt-3"><StatusBadge status={status} /></div>
        </div>
        <div className="rounded-[2rem] border border-stone-200 bg-stone-50 p-5 text-sm leading-7 text-stone-600">
          <p className="font-semibold text-stone-950">Customer details</p>
          <p className="mt-2">{invoice.customer.name}</p>
          <p>{invoice.customer.phone}</p>
          <p>{invoice.customer.location}</p>
        </div>
      </div>
      <div className="mt-6 overflow-hidden rounded-[2rem] border border-stone-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-[0.24em] text-stone-500">
            <tr>
              <th className="px-5 py-4">Item</th>
              <th className="px-5 py-4">Choice</th>
              <th className="px-5 py-4">Qty</th>
              <th className="px-5 py-4">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={`${item.productId}-${item.size}-${item.color}`} className="border-t border-stone-200 text-stone-700">
                <td className="px-5 py-4 font-medium text-stone-950">{item.name}</td>
                <td className="px-5 py-4">{item.color} / size {item.size}</td>
                <td className="px-5 py-4">{item.quantity}</td>
                <td className="px-5 py-4">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[2rem] bg-stone-950 p-5 text-sm leading-7 text-stone-200">
          <p className="font-semibold text-white">Payment instructions</p>
          <p className="mt-2">Paybill number: {settings.paybillNumber}</p>
          <p>Account name: {settings.paybillAccountName}</p>
          <p>Reference: {settings.paybillReferencePrefix}-{invoice.orderReference}</p>
          <p className="mt-3">Thank you for shopping with Claddie KENYA. We look forward to serving you again.</p>
        </div>
        <div className="rounded-[2rem] border border-orange-200 bg-orange-50 p-5">
          <p className="text-sm text-stone-600">Total amount</p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">{formatCurrency(invoice.total)}</p>
        </div>
      </div>
    </div>
  );
}

export function App() {
  const [page, setPage] = useState<Page>(getPageFromLocation());

  // demo Supabase call: logs first few products (requires tables to exist)
  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .limit(5)
      .then(({ data, error }) => {
        if (error) console.error("Supabase fetch error", error);
        else console.log("sample products from Supabase:", data);
      });
  }, []);
  const [products, setProducts] = useState<Product[]>(() => readStorage(PRODUCT_KEY, DEFAULT_PRODUCTS));
  const [orders, setOrders] = useState<Order[]>(() => readStorage(ORDER_KEY, []));
  const [invoices, setInvoices] = useState<Invoice[]>(() => readStorage(INVOICE_KEY, []));
  const [users, setUsers] = useState<UserAccount[]>(() => readStorage(USER_KEY, []));
  const [settings, setSettings] = useState<Settings>(() => ({ ...DEFAULT_SETTINGS, ...readStorage(SETTINGS_KEY, DEFAULT_SETTINGS) }));
  const [cart, setCart] = useState<CartItem[]>(() => readStorage(CART_KEY, []));
  const [messages, setMessages] = useState<Message[]>(() => readStorage(MESSAGE_KEY, []));
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => readStorage<string | null>(USER_SESSION_KEY, null));
  const [productSelections, setProductSelections] = useState<Record<string, ProductSelection>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register" | "account" | "forgot" | "reset">("login");
  const [authIntent, setAuthIntent] = useState<"checkout" | "chat" | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [adminStage, setAdminStage] = useState<AdminStage>(() => (readSession(ADMIN_QUIZ_KEY) ? (readSession(ADMIN_AUTH_KEY) ? "dashboard" : "password") : "quiz"));
  const [adminTab, setAdminTab] = useState<AdminTab>("inventory");
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventorySort, setInventorySort] = useState<SortMode>("newest");
  const [shopSearch, setShopSearch] = useState("");
  const [shopAudience, setShopAudience] = useState("All");
  const [shopCategory, setShopCategory] = useState("All");
  const [shopType, setShopType] = useState("All");
  const [shopColor, setShopColor] = useState("All");
  const [shopFeaturedOnly, setShopFeaturedOnly] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM);
  const [imageDropActive, setImageDropActive] = useState(false);
  const [productError, setProductError] = useState("");
  const [checkoutForm, setCheckoutForm] = useState<CheckoutFormState>(EMPTY_CHECKOUT);
  const [checkoutError, setCheckoutError] = useState("");
  const [trackingReference, setTrackingReference] = useState("");
  const [trackingResult, setTrackingResult] = useState<Order | null>(null);
  const [latestOrderId, setLatestOrderId] = useState<string | null>(() => readStorage<string | null>(LAST_ORDER_KEY, null));
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizError, setQuizError] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [accountPasswordForm, setAccountPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [passwordResetRequest, setPasswordResetRequest] = useState<PasswordResetRequest | null>(null);
  const [passwordResetForm, setPasswordResetForm] = useState({ email: "", code: "", newPassword: "" });
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [adminPasswordForm, setAdminPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [customerChatForm, setCustomerChatForm] = useState({ name: "", orderReference: "", message: "" });
  const [chatError, setChatError] = useState("");
  const [chatSuccess, setChatSuccess] = useState("");
  const [adminReply, setAdminReply] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState<string>("");
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [copiedPayment, setCopiedPayment] = useState(false);

  useEffect(() => {
    const syncPage = () => setPage(getPageFromLocation());
    window.addEventListener("popstate", syncPage);
    return () => window.removeEventListener("popstate", syncPage);
  }, []);

  useEffect(() => hideArenaBadge(), []);
  useEffect(() => writeStorage(PRODUCT_KEY, products), [products]);
  useEffect(() => writeStorage(ORDER_KEY, orders), [orders]);
  useEffect(() => writeStorage(INVOICE_KEY, invoices), [invoices]);
  useEffect(() => writeStorage(USER_KEY, users), [users]);
  useEffect(() => writeStorage(SETTINGS_KEY, settings), [settings]);
  useEffect(() => writeStorage(CART_KEY, cart), [cart]);
  useEffect(() => writeStorage(MESSAGE_KEY, messages), [messages]);
  useEffect(() => writeStorage(USER_SESSION_KEY, currentUserId), [currentUserId]);

  useEffect(() => {
    setProductSelections((current) => {
      const next = { ...current };
      let changed = false;
      products.forEach((product) => {
        const selection = current[product.id];
        if (!selection) {
          next[product.id] = createSelection(product);
          changed = true;
          return;
        }
        if (!product.sizes.includes(selection.size) || !product.colors.includes(selection.color) || selection.imageIndex >= product.images.length) {
          next[product.id] = {
            size: product.sizes.includes(selection.size) ? selection.size : product.sizes[0] || "",
            color: product.colors.includes(selection.color) ? selection.color : product.colors[0] || "",
            quantity: Math.max(1, selection.quantity),
            imageIndex: Math.min(selection.imageIndex, Math.max(product.images.length - 1, 0)),
          };
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [products]);

  useEffect(() => {
    const lastOrder = latestOrderId ? orders.find((order) => order.id === latestOrderId) : null;
    if (lastOrder) {
      setTrackingResult(lastOrder);
      setTrackingReference(lastOrder.reference);
    }
  }, [latestOrderId, orders]);

  useEffect(() => {
    if (!selectedThreadId && messages.length) {
      setSelectedThreadId(messages[0].threadId);
    }
  }, [messages, selectedThreadId]);

  const currentUser = useMemo(() => users.find((user) => user.id === currentUserId) || null, [users, currentUserId]);
  const myOrders = useMemo(() => orders.filter((order) => order.userId === currentUserId), [orders, currentUserId]);
  const latestOrder = useMemo(() => orders.find((order) => order.id === latestOrderId) || null, [orders, latestOrderId]);
  const latestInvoice = useMemo(() => (latestOrder ? invoices.find((invoice) => invoice.orderReference === latestOrder.reference) || null : null), [invoices, latestOrder]);
  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.category))).sort(), [products]);
  const shoeTypes = useMemo(() => Array.from(new Set(products.map((product) => product.shoeType))).sort(), [products]);
  const audiences = useMemo(() => Array.from(new Set(products.map((product) => product.audience))).sort(), [products]);
  const colors = useMemo(() => Array.from(new Set(products.flatMap((product) => product.colors))).sort(), [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query = shopSearch.trim().toLowerCase();
      const matchesSearch =
        !query ||
        [product.name, product.category, product.shoeType, product.audience, product.description].some((field) => field.toLowerCase().includes(query));
      const matchesAudience = shopAudience === "All" || product.audience === shopAudience;
      const matchesCategory = shopCategory === "All" || product.category === shopCategory;
      const matchesType = shopType === "All" || product.shoeType === shopType;
      const matchesColor = shopColor === "All" || product.colors.includes(shopColor);
      const matchesFeatured = !shopFeaturedOnly || product.featured;
      return matchesSearch && matchesAudience && matchesCategory && matchesType && matchesColor && matchesFeatured;
    });
  }, [products, shopSearch, shopAudience, shopCategory, shopType, shopColor, shopFeaturedOnly]);

  const inventoryProducts = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase();
    const filtered = products.filter((product) => {
      return !query || [product.name, product.category, product.shoeType, product.audience, product.description].some((field) => field.toLowerCase().includes(query));
    });
    return [...filtered].sort((a, b) => {
      if (inventorySort === "low-stock") return a.stock - b.stock || a.name.localeCompare(b.name);
      if (inventorySort === "category") return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [products, inventorySearch, inventorySort]);

  const cartDetails = useMemo(() => {
    return cart
      .map((item, index) => {
        const product = products.find((entry) => entry.id === item.productId);
        if (!product) return null;
        return { index, product, size: item.size, color: item.color, quantity: item.quantity, lineTotal: product.price * item.quantity };
      })
      .filter(Boolean) as Array<{ index: number; product: Product; size: string; color: string; quantity: number; lineTotal: number }>;
  }, [cart, products]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cartDetails.reduce((sum, item) => sum + item.lineTotal, 0), [cartDetails]);

  const customerThreadId = useMemo(() => {
    if (currentUser) return `user-${currentUser.id}`;
    const saved = readStorage<string | null>(GUEST_THREAD_KEY, null);
    if (saved) return saved;
    const generated = `guest-${makeReference("CHAT")}`;
    writeStorage(GUEST_THREAD_KEY, generated);
    return generated;
  }, [currentUser]);

  const customerMessages = useMemo(() => messages.filter((message) => message.threadId === customerThreadId), [messages, customerThreadId]);
  const groupedThreads = useMemo(() => {
    const map = new Map<string, Message[]>();
    messages.forEach((message) => {
      const threadMessages = map.get(message.threadId) || [];
      threadMessages.push(message);
      map.set(message.threadId, threadMessages);
    });
    return Array.from(map.entries())
      .map(([threadId, threadMessages]) => ({ threadId, threadMessages: threadMessages.sort((a, b) => a.createdAt.localeCompare(b.createdAt)) }))
      .sort((a, b) => b.threadMessages[b.threadMessages.length - 1].createdAt.localeCompare(a.threadMessages[a.threadMessages.length - 1].createdAt));
  }, [messages]);
  const selectedThread = groupedThreads.find((thread) => thread.threadId === selectedThreadId) || groupedThreads[0] || null;

  useEffect(() => {
    if (!currentUser) return;
    setCheckoutForm((current) => ({
      ...current,
      name: current.name || currentUser.name,
      phone: current.phone || currentUser.phone,
    }));
  }, [currentUser]);

  function clearAuthFeedback() {
    setAuthError("");
    setAuthMessage("");
  }

  function openAuthPanel(view: "login" | "register" | "account" | "forgot" | "reset") {
    clearAuthFeedback();
    setAuthView(view);
    setAuthOpen(true);
  }

  function closeAuthPanel() {
    setAuthOpen(false);
    setAuthIntent(null);
  }

  function completeCustomerAuth(nextUser: UserAccount) {
    setCurrentUserId(nextUser.id);
    setCheckoutForm((current) => ({ ...current, name: nextUser.name, phone: nextUser.phone }));

    if (authIntent === "checkout") {
      setAuthOpen(false);
      setCartOpen(true);
      setCheckoutError("");
      setAuthIntent(null);
      return;
    }

    if (authIntent === "chat") {
      setAuthOpen(false);
      setChatOpen(true);
      setChatError("");
      setAuthIntent(null);
      return;
    }

    setAuthView("account");
  }

  function requireCustomerLogin(reason: "place an order" | "send a message") {
    if (currentUser) return true;
    setAuthIntent(reason === "place an order" ? "checkout" : "chat");
    setAuthError("");
    setAuthMessage(`Please sign in to ${reason}.`);
    setAuthView("login");
    setAuthOpen(true);
    return false;
  }

  function openAdmin() {
    writeSession(ADMIN_QUIZ_KEY, false);
    writeSession(ADMIN_AUTH_KEY, false);
    setAdminStage("quiz");
    setQuizAnswer("");
    setAdminPasswordInput("");
    navigate("admin");
  }

  function updateProductSelection(productId: string, updates: Partial<ProductSelection>) {
    setProductSelections((current) => ({ ...current, [productId]: { ...current[productId], ...updates } }));
  }

  function addToCart(product: Product) {
    const selection = productSelections[product.id] || createSelection(product);
    if (!selection.size || !selection.color) return;
    setCart((current) => {
      const existingIndex = current.findIndex((item) => item.productId === product.id && item.size === selection.size && item.color === selection.color);
      if (existingIndex >= 0) {
        return current.map((item, index) => (index === existingIndex ? { ...item, quantity: item.quantity + Math.max(1, selection.quantity) } : item));
      }
      return [...current, { productId: product.id, size: selection.size, color: selection.color, quantity: Math.max(1, selection.quantity) }];
    });
    setCartOpen(true);
  }

  function updateCartItem(index: number, quantity: number) {
    setCart((current) => {
      if (quantity <= 0) return current.filter((_, itemIndex) => itemIndex !== index);
      return current.map((item, itemIndex) => (itemIndex === index ? { ...item, quantity } : item));
    });
  }

  function clearCart() {
    setCart([]);
  }

  function submitTracking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const match = orders.find((order) => order.reference.toLowerCase() === trackingReference.trim().toLowerCase());
    setTrackingResult(match || null);
  }

  function submitQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (normalizeAnswer(quizAnswer) !== normalizeAnswer(settings.adminQuizAnswer)) {
      setQuizError("That answer is not correct.");
      return;
    }
    writeSession(ADMIN_QUIZ_KEY, true);
    setQuizError("");
    setAdminStage("password");
  }

  function submitAdminPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (adminPasswordInput !== settings.adminPassword) {
      setAdminPasswordError("Incorrect password.");
      return;
    }
    writeSession(ADMIN_AUTH_KEY, true);
    setAdminPasswordError("");
    setAdminStage("dashboard");
  }

  function logoutAdmin() {
    writeSession(ADMIN_AUTH_KEY, false);
    writeSession(ADMIN_QUIZ_KEY, false);
    setAdminStage("quiz");
    setAdminPasswordInput("");
    setQuizAnswer("");
    navigate("home");
  }

  function beginEdit(product: Product) {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      audience: product.audience,
      shoeType: product.shoeType,
      category: product.category,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      sizes: product.sizes.join(", "),
      colors: product.colors.join(", "),
      instagramUrl: product.instagramUrl,
      featured: product.featured,
      images: product.images,
    });
    setProductError("");
  }

  function resetProductForm() {
    setEditingProductId(null);
    setProductForm(EMPTY_PRODUCT_FORM);
    setProductError("");
  }

  async function addFilesToForm(files: FileList | File[]) {
    const validFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!validFiles.length) return;
    const dataUrls = await Promise.all(validFiles.map((file) => readFileAsDataUrl(file)));
    setProductForm((current) => ({ ...current, images: [...current.images, ...dataUrls] }));
  }

  async function handleImageInput(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.files?.length) return;
    await addFilesToForm(event.target.files);
    event.target.value = "";
  }

  async function handleImageDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setImageDropActive(false);
    if (!event.dataTransfer.files?.length) return;
    await addFilesToForm(event.dataTransfer.files);
  }

  function moveImage(index: number, direction: -1 | 1) {
    setProductForm((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.images.length) return current;
      const next = [...current.images];
      const [image] = next.splice(index, 1);
      next.splice(target, 0, image);
      return { ...current, images: next };
    });
  }

  function removeImage(index: number) {
    setProductForm((current) => ({ ...current, images: current.images.filter((_, imageIndex) => imageIndex !== index) }));
  }

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productForm.name.trim() || !productForm.price.trim() || !productForm.stock.trim()) {
      setProductError("Please complete the product name, price, and available quantity.");
      return;
    }
    if (!productForm.images.length) {
      setProductError("Please upload at least one product image.");
      return;
    }

    const product: Product = {
      id: editingProductId || `${slugify(productForm.name)}-${Date.now().toString().slice(-5)}`,
      name: productForm.name.trim(),
      audience: productForm.audience,
      shoeType: productForm.shoeType,
      category: productForm.category,
      description: productForm.description.trim() || "Quality footwear from Claddie KENYA.",
      price: Math.max(0, Number(productForm.price)),
      stock: Math.max(0, Math.round(Number(productForm.stock))),
      sizes: parseList(productForm.sizes),
      colors: parseList(productForm.colors),
      images: productForm.images,
      instagramUrl: productForm.instagramUrl.trim(),
      featured: productForm.featured,
      createdAt: editingProductId ? products.find((item) => item.id === editingProductId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
    };

    setProducts((current) => {
      if (editingProductId) return current.map((item) => (item.id === editingProductId ? product : item));
      return [product, ...current];
    });
    resetProductForm();
  }

  function updateOrderStatus(orderId: string, status: OrderStatus) {
    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));
  }

  function quickAdjustStock(productId: string, delta: number) {
    setProducts((current) => current.map((product) => (product.id === productId ? { ...product, stock: Math.max(0, product.stock + delta) } : product)));
  }

  function deleteProduct(productId: string) {
    setProducts((current) => current.filter((product) => product.id !== productId));
    if (editingProductId === productId) resetProductForm();
  }

  function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requireCustomerLogin("place an order")) {
      setCheckoutError("Please sign in to place your order.");
      return;
    }
    if (!cartDetails.length) {
      setCheckoutError("Your cart is empty.");
      return;
    }
    if (!checkoutForm.name.trim() || !checkoutForm.phone.trim() || !checkoutForm.location.trim()) {
      setCheckoutError("Please provide your name, phone number, and delivery area.");
      return;
    }

    const missingStock = cartDetails.find((item) => item.quantity > item.product.stock);
    if (missingStock) {
      setCheckoutError(`${missingStock.product.name} does not have enough stock for that quantity.`);
      return;
    }

    const items: OrderLine[] = cartDetails.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unitPrice: item.product.price,
      lineTotal: item.product.price * item.quantity,
    }));
    const order: Order = {
      id: makeReference("ORDER"),
      reference: makeReference("CK"),
      invoiceReference: makeReference("INV"),
      createdAt: new Date().toISOString(),
      status: "Pending payment",
      customer: checkoutForm,
      items,
      total: items.reduce((sum, item) => sum + item.lineTotal, 0),
      userId: currentUser?.id,
    };
    const invoice = createInvoice(order);

    setOrders((current) => [order, ...current]);
    setInvoices((current) => [invoice, ...current]);
    setProducts((current) =>
      current.map((product) => {
        const orderedUnits = items.filter((item) => item.productId === product.id).reduce((sum, item) => sum + item.quantity, 0);
        return orderedUnits ? { ...product, stock: Math.max(0, product.stock - orderedUnits) } : product;
      }),
    );
    setLatestOrderId(order.id);
    writeStorage(LAST_ORDER_KEY, order.id);
    setTrackingReference(order.reference);
    setTrackingResult(order);
    setCart([]);
    setCheckoutError("");
    setCheckoutForm(currentUser ? { name: currentUser.name, phone: currentUser.phone, location: "", notes: "" } : EMPTY_CHECKOUT);
    setCartOpen(true);
  }

  function registerUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = registerForm.name.trim();
    const email = registerForm.email.trim().toLowerCase();
    const phone = registerForm.phone.trim();
    const password = registerForm.password;
    if (!name || !email || !password) {
      setAuthError("Please complete your name, email address, and password.");
      return;
    }
    if (users.some((user) => user.email.toLowerCase() === email)) {
      setAuthError("An account with that email already exists.");
      return;
    }
    const nextUser: UserAccount = {
      id: makeReference("USER"),
      name,
      email,
      phone,
      password,
      createdAt: new Date().toISOString(),
    };
    setUsers((current) => [nextUser, ...current]);
    setAuthError("");
    setAuthMessage("Your account has been created successfully.");
    setRegisterForm({ name: "", email: "", phone: "", password: "" });
    completeCustomerAuth(nextUser);
  }

  function loginUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = loginForm.email.trim().toLowerCase();
    const password = loginForm.password;
    const user = users.find((entry) => entry.email.toLowerCase() === email && entry.password === password);
    if (!user) {
      setAuthError("The email address or password is not correct.");
      return;
    }
    setAuthError("");
    setAuthMessage(`Welcome back, ${user.name}.`);
    setLoginForm({ email: "", password: "" });
    completeCustomerAuth(user);
  }

  function logoutUser() {
    setCurrentUserId(null);
    setAuthMessage("You have signed out.");
    setAuthView("login");
    setAuthIntent(null);
  }

  function changeUserPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser) return;
    if (accountPasswordForm.currentPassword !== currentUser.password) {
      setAuthError("Your current password is not correct.");
      return;
    }
    if (!accountPasswordForm.newPassword.trim()) {
      setAuthError("Please enter a new password.");
      return;
    }
    setUsers((current) => current.map((user) => (user.id === currentUser.id ? { ...user, password: accountPasswordForm.newPassword } : user)));
    setAuthError("");
    setAuthMessage("Your password has been changed.");
    setAccountPasswordForm({ currentPassword: "", newPassword: "" });
  }

  async function sendPasswordResetCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = forgotPasswordEmail.trim().toLowerCase();
    const user = users.find((entry) => entry.email.toLowerCase() === email);
    if (!email) {
      setAuthError("Please enter the email address you used for your account.");
      return;
    }
    if (!user) {
      setAuthError("We could not find an account with that email address.");
      return;
    }

    const request: PasswordResetRequest = {
      email,
      code: `${Math.floor(100000 + Math.random() * 900000)}`,
      expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
    };

    if (!canSendResetEmails(settings)) {
      setAuthError("Password reset email delivery is not set up yet. Add your EmailJS details in the admin settings first.");
      return;
    }

    try {
      setSendingResetEmail(true);
      await sendResetEmail(settings, user, request);
      setPasswordResetRequest(request);
      setPasswordResetForm({ email, code: "", newPassword: "" });
      setForgotPasswordEmail(email);
      setAuthError("");
      setAuthMessage(`We have emailed a verification code to ${email}. Enter it below to choose a new password.`);
      setAuthView("reset");
    } catch {
      setAuthError("We could not send the reset email right now. Please confirm the email delivery settings and try again.");
    } finally {
      setSendingResetEmail(false);
    }
  }

  function resetUserPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordResetRequest) {
      setAuthError("Start with your email address so we can prepare your password reset.");
      setAuthView("forgot");
      return;
    }
    if (new Date(passwordResetRequest.expiresAt).getTime() < Date.now()) {
      setAuthError("Your reset code has expired. Request a new password reset.");
      setPasswordResetRequest(null);
      setAuthView("forgot");
      return;
    }
    if (passwordResetForm.email.trim().toLowerCase() !== passwordResetRequest.email) {
      setAuthError("Use the same email address that received the reset code.");
      return;
    }
    if (passwordResetForm.code.trim() !== passwordResetRequest.code) {
      setAuthError("The verification code is not correct.");
      return;
    }
    if (!passwordResetForm.newPassword.trim()) {
      setAuthError("Please enter a new password.");
      return;
    }

    setUsers((current) =>
      current.map((user) =>
        user.email.toLowerCase() === passwordResetRequest.email ? { ...user, password: passwordResetForm.newPassword } : user,
      ),
    );
    setPasswordResetRequest(null);
    setPasswordResetForm({ email: "", code: "", newPassword: "" });
    setForgotPasswordEmail("");
    setLoginForm({ email: passwordResetRequest.email, password: "" });
    setAuthError("");
    setAuthMessage("Your password has been updated. Sign in with your new password.");
    setAuthView("login");
  }

  function changeAdminPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (adminPasswordForm.currentPassword !== settings.adminPassword) {
      setProductError("The current admin password is not correct.");
      return;
    }
    if (!adminPasswordForm.newPassword.trim()) {
      setProductError("Please enter a new admin password.");
      return;
    }
    setSettings((current) => ({ ...current, adminPassword: adminPasswordForm.newPassword }));
    setAdminPasswordForm({ currentPassword: "", newPassword: "" });
    setProductError("");
  }

  function submitCustomerChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requireCustomerLogin("send a message")) {
      setChatError("Please sign in to send a message.");
      return;
    }
    const message = customerChatForm.message.trim();
    const name = currentUser?.name || customerChatForm.name.trim();
    if (!message) {
      setChatError("Please enter your message.");
      return;
    }
    const nextMessage: Message = {
      id: makeReference("MSG"),
      threadId: customerThreadId,
      senderType: "customer",
      senderName: name,
      customerLabel: name,
      orderReference: customerChatForm.orderReference.trim(),
      message,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, nextMessage]);
    setCustomerChatForm((current) => ({ ...current, message: "" }));
    setChatError("");
    setChatSuccess("Your message has been sent.");
    window.setTimeout(() => setChatSuccess(""), 1500);
  }

  function sendAdminReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedThread || !adminReply.trim()) return;
    const customerLabel = selectedThread.threadMessages[0]?.customerLabel || "Customer";
    const orderReference = selectedThread.threadMessages.find((message) => message.orderReference)?.orderReference || "";
    const nextMessage: Message = {
      id: makeReference("MSG"),
      threadId: selectedThread.threadId,
      senderType: "admin",
      senderName: "Claddie KENYA",
      customerLabel,
      orderReference,
      message: adminReply.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, nextMessage]);
    setAdminReply("");
  }

  const navigation = page === "admin" ? null : (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-stone-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 text-white sm:px-6 lg:px-8">
        <button type="button" onClick={() => navigate("home")} className="text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-orange-300">Nairobi shoe shop</p>
          <p className="mt-1 text-2xl font-semibold tracking-[0.22em]">CLADDIE KENYA</p>
        </button>
        <nav className="hidden items-center gap-8 text-sm font-medium text-stone-300 md:flex">
          <button type="button" onClick={() => navigate("home")} className={cls("transition hover:text-white", page === "home" && "text-white")}>Home</button>
          <button type="button" onClick={() => navigate("shop")} className={cls("transition hover:text-white", page === "shop" && "text-white")}>Shop</button>
          <button type="button" onClick={() => navigate("home")} className="transition hover:text-white">Track order</button>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <button type="button" onClick={() => openAuthPanel(currentUser ? "account" : "login")} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40">{currentUser ? currentUser.name.split(" ")[0] : "Account"}</button>
          <button type="button" onClick={() => setCartOpen(true)} className="relative rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400">Cart<span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">{cartCount}</span></button>
        </div>
      </div>
    </header>
  );

  const homePage = (
    <main>
      <section className="relative overflow-hidden bg-stone-950">
        <img src={HERO_IMAGE} alt="Claddie KENYA shoes" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/90 to-stone-950/60" />
        <div className="relative mx-auto grid min-h-[88vh] max-w-7xl items-end gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.38em] text-orange-300">CLADDIE KENYA</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">Shoes your family will love, priced for real life in Nairobi.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-300 sm:text-lg">Discover quality heels, everyday sneakers, boots, and family footwear with fair pricing, helpful service, and delivery you can trust.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => navigate("shop")} className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-400">Shop available shoes</button>
              <button type="button" onClick={() => document.getElementById("track-order")?.scrollIntoView({ behavior: "smooth" })} className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/45">Track your order</button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["4.7 out of 5", "Loved for reliable service and consistent quality."],
                ["Affordable pricing", "Customers return for value, discounts, and honest pricing."],
                ["Delivery across Nairobi", "Online-first shopping with dependable order handling."],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <p className="text-lg font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-300">{copy}</p>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.1 }} className="self-center rounded-[2.5rem] border border-white/10 bg-white/10 p-6 backdrop-blur sm:p-8">
            <SectionTitle eyebrow="Why customers choose us" title="A modern shoe shop built around convenience and trust." copy="Claddie KENYA combines a wide variety of shoes, dependable service, and family-friendly pricing in one simple shopping experience." invert />
            <div className="mt-6 grid gap-4">
              {["Wide variety for men, women, and growing families.", "Comfortable, durable pairs for work, weekends, and special occasions.", "Friendly support from order placement to delivery."].map((item) => (
                <div key={item} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-stone-200">{item}</div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <SectionTitle eyebrow="Featured pairs" title="Popular styles ready to order today." copy="Browse customer favorites from our current selection and choose the size and color that fits your needs." />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {products.filter((product) => product.featured).slice(0, 3).map((product) => {
            const selection = productSelections[product.id] || createSelection(product);
            return (
              <article key={product.id} className={PANEL_CLASS}>
                <img src={product.images[selection.imageIndex] || product.images[0]} alt={product.name} className="h-80 w-full rounded-t-[2rem] object-cover" />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-stone-500">{product.category} / {product.shoeType}</p>
                      <h3 className="mt-2 text-2xl font-semibold text-stone-950">{product.name}</h3>
                    </div>
                    <p className="text-sm font-semibold text-stone-950">{formatCurrency(product.price)}</p>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-stone-600">{product.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {product.images.map((image, index) => (
                      <button key={`${product.id}-thumb-${index}`} type="button" onClick={() => updateProductSelection(product.id, { imageIndex: index })} className={cls("h-14 w-14 overflow-hidden rounded-full border-2", selection.imageIndex === index ? "border-orange-500" : "border-transparent")}>
                        <img src={image} alt={`${product.name} view ${index + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <select value={selection.size} onChange={(event) => updateProductSelection(product.id, { size: event.target.value })} className={INPUT_CLASS}>{product.sizes.map((size) => <option key={size} value={size}>Size {size}</option>)}</select>
                    <select value={selection.color} onChange={(event) => updateProductSelection(product.id, { color: event.target.value })} className={INPUT_CLASS}>{product.colors.map((color) => <option key={color} value={color}>{color}</option>)}</select>
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 rounded-full border border-stone-200 px-2 py-1">
                      <button type="button" onClick={() => updateProductSelection(product.id, { quantity: Math.max(1, selection.quantity - 1) })} className="h-9 w-9 rounded-full border border-stone-200 text-lg">-</button>
                      <span className="min-w-6 text-center text-sm font-semibold">{selection.quantity}</span>
                      <button type="button" onClick={() => updateProductSelection(product.id, { quantity: selection.quantity + 1 })} className="h-9 w-9 rounded-full border border-stone-200 text-lg">+</button>
                    </div>
                    <button type="button" onClick={() => addToCart(product)} className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800">Add to cart</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="track-order" className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <SectionTitle eyebrow="Order tracking" title="Check your delivery progress any time." copy="Enter your order reference to see the latest delivery status from payment to final delivery." />
          </div>
          <div className="rounded-[2.5rem] border border-stone-200 bg-stone-50 p-6 sm:p-8">
            <form onSubmit={submitTracking} className="grid gap-4">
              <Field label="Order reference"><input value={trackingReference} onChange={(event) => setTrackingReference(event.target.value)} placeholder="Example: CK-ABC1234" className={INPUT_CLASS} /></Field>
              <button type="submit" className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800">Track order</button>
            </form>
            {trackingReference && !trackingResult ? <p className="mt-5 text-sm text-stone-500">No order was found for that reference yet. Please check and try again.</p> : null}
            {trackingResult ? (
              <div className="mt-6 rounded-[2rem] border border-orange-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-stone-500">Order reference</p>
                    <p className="mt-1 text-xl font-semibold text-stone-950">{trackingResult.reference}</p>
                  </div>
                  <StatusBadge status={trackingResult.status} />
                </div>
                <p className="mt-4 text-sm leading-7 text-stone-600">Customer: {trackingResult.customer.name}. Total: {formatCurrency(trackingResult.total)}.</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );

  const shopPage = (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.32fr_0.68fr]">
        <aside className="h-fit rounded-[2.5rem] border border-stone-200 bg-white p-6 shadow-sm">
          <SectionTitle eyebrow="Find your pair" title="Filter the collection" copy="Search by style, category, color, or audience to narrow down what is available now." />
          <div className="mt-6 grid gap-4">
            <Field label="Search"><input value={shopSearch} onChange={(event) => setShopSearch(event.target.value)} placeholder="Search shoes" className={INPUT_CLASS} /></Field>
            <Field label="Audience"><select value={shopAudience} onChange={(event) => setShopAudience(event.target.value)} className={INPUT_CLASS}><option>All</option>{audiences.map((audience) => <option key={audience}>{audience}</option>)}</select></Field>
            <Field label="Category"><select value={shopCategory} onChange={(event) => setShopCategory(event.target.value)} className={INPUT_CLASS}><option>All</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></Field>
            <Field label="Shoe type"><select value={shopType} onChange={(event) => setShopType(event.target.value)} className={INPUT_CLASS}><option>All</option>{shoeTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>
            <Field label="Color"><select value={shopColor} onChange={(event) => setShopColor(event.target.value)} className={INPUT_CLASS}><option>All</option>{colors.map((color) => <option key={color}>{color}</option>)}</select></Field>
            <label className="flex items-center gap-3 rounded-full border border-stone-200 px-4 py-3 text-sm text-stone-700">
              <input type="checkbox" checked={shopFeaturedOnly} onChange={(event) => setShopFeaturedOnly(event.target.checked)} className="h-4 w-4 rounded-full" />
              Show featured styles only
            </label>
          </div>
        </aside>
        <section>
          <SectionTitle eyebrow="Available now" title="Choose your style, color, and size." copy="Every pair below is available to order. Select your preferred options and add them to your cart." />
          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            {filteredProducts.map((product) => {
              const selection = productSelections[product.id] || createSelection(product);
              return (
                <article key={product.id} className={PANEL_CLASS}>
                  <div className="relative">
                    <img src={product.images[selection.imageIndex] || product.images[0]} alt={product.name} className="h-80 w-full rounded-t-[2rem] object-cover" />
                    {product.instagramUrl ? <a href={product.instagramUrl} target="_blank" rel="noreferrer" className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-stone-900 backdrop-blur">View on Instagram</a> : null}
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-stone-500">{product.audience} / {product.category}</p>
                        <h3 className="mt-2 text-2xl font-semibold text-stone-950">{product.name}</h3>
                      </div>
                      <p className="text-sm font-semibold text-stone-950">{formatCurrency(product.price)}</p>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-stone-600">{product.description}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {product.images.map((image, index) => (
                        <button key={`${product.id}-image-${index}`} type="button" onClick={() => updateProductSelection(product.id, { imageIndex: index })} className={cls("h-14 w-14 overflow-hidden rounded-full border-2", selection.imageIndex === index ? "border-orange-500" : "border-transparent")}>
                          <img src={image} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <Field label="Size"><select value={selection.size} onChange={(event) => updateProductSelection(product.id, { size: event.target.value })} className={INPUT_CLASS}>{product.sizes.map((size) => <option key={size} value={size}>Size {size}</option>)}</select></Field>
                      <Field label="Color"><select value={selection.color} onChange={(event) => updateProductSelection(product.id, { color: event.target.value })} className={INPUT_CLASS}>{product.colors.map((color) => <option key={color} value={color}>{color}</option>)}</select></Field>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 rounded-full border border-stone-200 px-2 py-1">
                        <button type="button" onClick={() => updateProductSelection(product.id, { quantity: Math.max(1, selection.quantity - 1) })} className="h-9 w-9 rounded-full border border-stone-200 text-lg">-</button>
                        <span className="min-w-6 text-center text-sm font-semibold">{selection.quantity}</span>
                        <button type="button" onClick={() => updateProductSelection(product.id, { quantity: selection.quantity + 1 })} className="h-9 w-9 rounded-full border border-stone-200 text-lg">+</button>
                      </div>
                      <span className="text-sm text-stone-500">{product.stock} in stock</span>
                      <button type="button" onClick={() => addToCart(product)} className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800">Add to cart</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {!filteredProducts.length ? <div className="mt-8 rounded-[2rem] border border-dashed border-stone-300 bg-white p-8 text-sm text-stone-500">No shoes match your filters right now. Try changing the search or filter options.</div> : null}
        </section>
      </div>
    </main>
  );

  const publicFooter = page === "admin" ? null : (
    <footer className="bg-stone-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-orange-300">About Claddie KENYA</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white">Quality footwear, honest pricing, and dependable service.</h2>
          <p className="mt-5 max-w-2xl text-sm leading-8 text-stone-300 sm:text-base">{settings.aboutText}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate("shop")} className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-400">Shop shoes</button>
            <button type="button" onClick={() => document.getElementById("track-order")?.scrollIntoView({ behavior: "smooth" })} className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/35">Track order</button>
          </div>
        </div>
        <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-orange-300">Contact us</p>
          <div className="mt-5 space-y-4 text-sm leading-7 text-stone-300">
            <p><span className="font-semibold text-white">Phone:</span> {settings.businessPhone}</p>
            <p><span className="font-semibold text-white">Location:</span> {settings.businessLocation}</p>
            <p><span className="font-semibold text-white">Hours:</span> {settings.businessHours}</p>
            <p>Order online, track your delivery, and contact us whenever you need help choosing the right pair.</p>
          </div>
          <div className="mt-8 flex items-center justify-between gap-4 border-t border-white/10 pt-6">
            {currentUser ? (
              <>
                <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Admin access</p>
                <button type="button" onClick={openAdmin} className="rounded-full border border-stone-500 bg-stone-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-stone-600">Admin</button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );

  const adminGate = adminStage === "dashboard" ? (
    <div className="min-h-screen bg-stone-950 text-white">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 rounded-[2.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-orange-300">Private dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Claddie KENYA Admin</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-300">Manage inventory, update delivery progress, review customer messages, and maintain store settings from one place.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate("shop")} className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/35">Back to shop</button>
            <button type="button" onClick={logoutAdmin} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-stone-100">Log out</button>
          </div>
        </div>
        <div className="mt-8 grid gap-8 xl:grid-cols-[0.26fr_0.74fr]">
          <aside className="rounded-[2.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="grid gap-2">
              {[ ["inventory", "Inventory"], ["orders", "Orders"], ["messages", "Messages"], ["accounts", "Customers"], ["settings", "Settings"] ].map(([value, label]) => (
                <button key={value} type="button" onClick={() => setAdminTab(value as AdminTab)} className={cls("rounded-full px-4 py-3 text-left text-sm font-semibold transition", adminTab === value ? "bg-white text-stone-950" : "bg-transparent text-stone-300 hover:bg-white/10 hover:text-white")}>{label}</button>
              ))}
            </div>
            <div className="mt-6 grid gap-3">
              {[ ["Products", String(products.length)], ["Low stock", String(products.filter((product) => product.stock <= 5).length)], ["Open orders", String(orders.filter((order) => order.status !== "Delivered").length)] ].map(([label, value]) => (
                <div key={label} className="rounded-[2rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-400">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </aside>
          <main className="grid gap-8">
            {adminTab === "inventory" ? (
              <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                <form onSubmit={saveProduct} className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <SectionTitle eyebrow="Inventory" title={editingProductId ? "Edit product" : "Add a new product"} copy="Keep the product form focused on what customers need to see: the style, options, pricing, stock, and clear images." invert />
                  <div className="mt-6 grid gap-4">
                    <Field label="Product name" dark><input value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Audience" dark><input value={productForm.audience} onChange={(event) => setProductForm((current) => ({ ...current, audience: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                      <Field label="Shoe type" dark><input value={productForm.shoeType} onChange={(event) => setProductForm((current) => ({ ...current, shoeType: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Category" dark><input value={productForm.category} onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                      <Field label="Price (KES)" dark><input type="number" min="0" value={productForm.price} onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                    </div>
                    <Field label="Available quantity" dark><input type="number" min="0" value={productForm.stock} onChange={(event) => setProductForm((current) => ({ ...current, stock: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Sizes" hint="Example: 36, 37, 38, 39" dark><input value={productForm.sizes} onChange={(event) => setProductForm((current) => ({ ...current, sizes: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                      <Field label="Colors" hint="Example: Black, White, Tan" dark><input value={productForm.colors} onChange={(event) => setProductForm((current) => ({ ...current, colors: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                    </div>
                    <Field label="Instagram product link" hint="Optional product or post link" dark><input value={productForm.instagramUrl} onChange={(event) => setProductForm((current) => ({ ...current, instagramUrl: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                    <Field label="Description" dark><textarea value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} className={cls(TEXTAREA_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                    <label onDragEnter={(event) => { event.preventDefault(); setImageDropActive(true); }} onDragOver={(event) => { event.preventDefault(); setImageDropActive(true); }} onDragLeave={(event) => { event.preventDefault(); setImageDropActive(false); }} onDrop={handleImageDrop} className={cls("grid gap-3 rounded-[2rem] border border-dashed px-5 py-8 text-center transition", imageDropActive ? "border-orange-400 bg-orange-50 text-stone-900" : "border-white/20 bg-white/5 text-stone-300")}>
                      <span className="text-sm font-semibold">Drag and drop product images here</span>
                      <span className="text-sm">or choose multiple images from your device</span>
                      <input type="file" accept="image/*" multiple onChange={handleImageInput} className="hidden" />
                      <span className="mx-auto rounded-full border border-current px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">Upload images</span>
                    </label>
                    {productForm.images.length ? (
                      <div className="grid gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">Gallery order</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {productForm.images.map((image, index) => (
                            <div key={`${image.slice(0, 24)}-${index}`} className="rounded-[2rem] border border-white/10 bg-white/5 p-3">
                              <img src={image} alt={`Upload ${index + 1}`} className="h-36 w-full rounded-[1.5rem] object-cover" />
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button type="button" onClick={() => moveImage(index, -1)} className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-35" disabled={index === 0}>Move left</button>
                                <button type="button" onClick={() => moveImage(index, 1)} className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-35" disabled={index === productForm.images.length - 1}>Move right</button>
                                <button type="button" onClick={() => removeImage(index)} className="rounded-full border border-red-400/30 px-3 py-1.5 text-xs font-semibold text-red-200">Remove</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <label className="flex items-center gap-3 rounded-full border border-white/10 px-4 py-3 text-sm text-stone-300">
                      <input type="checkbox" checked={productForm.featured} onChange={(event) => setProductForm((current) => ({ ...current, featured: event.target.checked }))} className="h-4 w-4 rounded-full" />
                      Feature this product on the front page
                    </label>
                    {productError ? <p className="text-sm text-orange-300">{productError}</p> : null}
                    <div className="flex flex-wrap gap-3">
                      <button type="submit" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-stone-100">{editingProductId ? "Save changes" : "Add product"}</button>
                      {editingProductId ? <button type="button" onClick={resetProductForm} className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/35">Cancel</button> : null}
                    </div>
                  </div>
                </form>
                <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <SectionTitle eyebrow="Inventory" title="Organized stock overview" copy="Search products quickly, sort what needs attention, and update stock without leaving the inventory list." invert />
                    <div className="grid gap-3 sm:min-w-[250px]">
                      <input value={inventorySearch} onChange={(event) => setInventorySearch(event.target.value)} placeholder="Search inventory" className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} />
                      <select value={inventorySort} onChange={(event) => setInventorySort(event.target.value as SortMode)} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")}>
                        <option value="newest">Sort by newest</option>
                        <option value="low-stock">Sort by low stock</option>
                        <option value="category">Sort by category</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10">
                    <div className="max-h-[860px] overflow-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-white/10 text-xs uppercase tracking-[0.24em] text-stone-300">
                          <tr><th className="px-4 py-4">Product</th><th className="px-4 py-4">Category</th><th className="px-4 py-4">Price</th><th className="px-4 py-4">Stock</th><th className="px-4 py-4">Actions</th></tr>
                        </thead>
                        <tbody>
                          {inventoryProducts.map((product) => (
                            <tr key={product.id} className="border-t border-white/10 text-stone-200">
                              <td className="px-4 py-4"><div className="flex items-center gap-3"><img src={product.images[0]} alt={product.name} className="h-16 w-16 rounded-full object-cover" /><div><p className="font-semibold text-white">{product.name}</p><p className="text-xs text-stone-400">{product.audience} / {product.shoeType}</p></div></div></td>
                              <td className="px-4 py-4">{product.category}</td>
                              <td className="px-4 py-4">{formatCurrency(product.price)}</td>
                              <td className="px-4 py-4"><div className="flex items-center gap-2"><button type="button" onClick={() => quickAdjustStock(product.id, -1)} className="h-8 w-8 rounded-full border border-white/15 text-base">-</button><span className="min-w-8 text-center font-semibold text-white">{product.stock}</span><button type="button" onClick={() => quickAdjustStock(product.id, 1)} className="h-8 w-8 rounded-full border border-white/15 text-base">+</button></div></td>
                              <td className="px-4 py-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => beginEdit(product)} className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white">Edit</button><button type="button" onClick={() => deleteProduct(product.id)} className="rounded-full border border-red-400/30 px-3 py-1.5 text-xs font-semibold text-red-200">Delete</button></div></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
            {adminTab === "orders" ? (
              <section className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
                <SectionTitle eyebrow="Orders" title="Track payment and delivery progress" copy="Each order already includes an invoice. Update the status as you confirm payment, prepare the pair, and complete delivery." invert />
                <div className="mt-6 grid gap-4">
                  {orders.length ? orders.map((order) => {
                    const invoice = invoices.find((entry) => entry.orderReference === order.reference);
                    return (
                      <div key={order.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-stone-400">{order.reference}</p>
                            <h3 className="mt-2 text-xl font-semibold text-white">{order.customer.name}</h3>
                            <p className="mt-2 text-sm leading-7 text-stone-300">{order.customer.phone} · {order.customer.location}</p>
                            <p className="text-sm leading-7 text-stone-300">{order.items.length} item(s) · {formatCurrency(order.total)}</p>
                          </div>
                          <div className="grid gap-3 sm:min-w-[260px]">
                            <select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value as OrderStatus)} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")}>
                              {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                            </select>
                            {invoice ? <div className="flex gap-2"><button type="button" onClick={() => copyText(buildInvoiceText(invoice, settings, order.status), setCopiedInvoice)} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white">{copiedInvoice ? "Copied" : "Copy invoice"}</button><button type="button" onClick={() => printInvoice(invoice, settings, order.status)} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-950">Print</button></div> : null}
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {order.items.map((item) => <span key={`${item.productId}-${item.color}-${item.size}`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-stone-300">{item.name} · {item.color} · size {item.size} · qty {item.quantity}</span>)}
                        </div>
                      </div>
                    );
                  }) : <div className="rounded-[2rem] border border-dashed border-white/15 p-8 text-sm text-stone-300">Orders will appear here after customers complete checkout.</div>}
                </div>
              </section>
            ) : null}
            {adminTab === "messages" ? (
              <section className="grid gap-6 lg:grid-cols-[0.36fr_0.64fr]">
                <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <SectionTitle eyebrow="Messages" title="Customer conversations" copy="Open any conversation and reply directly from the admin panel." invert />
                  <div className="mt-6 grid gap-3">
                    {groupedThreads.length ? groupedThreads.map((thread) => {
                      const latestMessage = thread.threadMessages[thread.threadMessages.length - 1];
                      return <button key={thread.threadId} type="button" onClick={() => setSelectedThreadId(thread.threadId)} className={cls("rounded-[2rem] border p-4 text-left transition", selectedThreadId === thread.threadId ? "border-white bg-white text-stone-950" : "border-white/10 bg-white/5 text-stone-200 hover:border-white/30")}><p className="font-semibold">{latestMessage.customerLabel}</p><p className="mt-1 text-sm opacity-80">{latestMessage.orderReference || "General enquiry"}</p><p className="mt-2 line-clamp-2 text-sm opacity-75">{latestMessage.message}</p></button>;
                    }) : <div className="rounded-[2rem] border border-dashed border-white/15 p-8 text-sm text-stone-300">Customer messages will appear here once chat is used.</div>}
                  </div>
                </div>
                <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
                  {selectedThread ? (
                    <>
                      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.22em] text-stone-400">Active conversation</p><h3 className="mt-2 text-2xl font-semibold text-white">{selectedThread.threadMessages[0]?.customerLabel || "Customer"}</h3></div>
                      <div className="mt-5 max-h-[480px] space-y-3 overflow-y-auto rounded-[2rem] border border-white/10 bg-stone-950/40 p-4">
                        {selectedThread.threadMessages.map((message) => (
                          <div key={message.id} className={cls("max-w-[85%] rounded-[1.5rem] px-4 py-3 text-sm leading-7", message.senderType === "admin" ? "ml-auto bg-emerald-500 text-white" : "border border-white/10 bg-white text-stone-700")}><p className="font-semibold">{message.senderName}</p><p className="mt-1">{message.message}</p><p className={cls("mt-2 text-xs", message.senderType === "admin" ? "text-emerald-50/80" : "text-stone-500")}>{new Date(message.createdAt).toLocaleString()}</p></div>
                        ))}
                      </div>
                      <form onSubmit={sendAdminReply} className="mt-5 grid gap-4"><textarea value={adminReply} onChange={(event) => setAdminReply(event.target.value)} placeholder="Write your reply" className={cls(TEXTAREA_CLASS, "border-white/10 bg-white text-stone-900")} /><button type="submit" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-stone-100">Send reply</button></form>
                    </>
                  ) : <div className="rounded-[2rem] border border-dashed border-white/15 p-8 text-sm text-stone-300">Select a conversation to reply.</div>}
                </div>
              </section>
            ) : null}
            {adminTab === "accounts" ? (
              <section className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
                <SectionTitle eyebrow="Customers" title="Account overview" copy="Review registered customer accounts and monitor which shoppers are ordering repeatedly." invert />
                <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-white/10 text-xs uppercase tracking-[0.24em] text-stone-300"><tr><th className="px-4 py-4">Name</th><th className="px-4 py-4">Email</th><th className="px-4 py-4">Phone</th><th className="px-4 py-4">Orders</th></tr></thead>
                    <tbody>
                      {users.length ? users.map((user) => <tr key={user.id} className="border-t border-white/10 text-stone-200"><td className="px-4 py-4 font-semibold text-white">{user.name}</td><td className="px-4 py-4">{user.email}</td><td className="px-4 py-4">{user.phone || "-"}</td><td className="px-4 py-4">{orders.filter((order) => order.userId === user.id).length}</td></tr>) : <tr><td className="px-4 py-6 text-stone-300" colSpan={4}>Customer accounts will appear here after sign up.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
            {adminTab === "settings" ? (
              <section className="grid gap-8 lg:grid-cols-2">
                <form className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <SectionTitle eyebrow="Store settings" title="Public business information" copy="These details appear in the customer footer, invoice, and checkout payment section." invert />
                  <div className="mt-6 grid gap-4">
                    <Field label="Business phone" dark><input value={settings.businessPhone} onChange={(event) => setSettings((current) => ({ ...current, businessPhone: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                    <Field label="Business location" dark><input value={settings.businessLocation} onChange={(event) => setSettings((current) => ({ ...current, businessLocation: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                    <Field label="Business hours" dark><input value={settings.businessHours} onChange={(event) => setSettings((current) => ({ ...current, businessHours: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                    <Field label="About text" dark><textarea value={settings.aboutText} onChange={(event) => setSettings((current) => ({ ...current, aboutText: event.target.value }))} className={cls(TEXTAREA_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Paybill number" dark><input value={settings.paybillNumber} onChange={(event) => setSettings((current) => ({ ...current, paybillNumber: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                      <Field label="Account name" dark><input value={settings.paybillAccountName} onChange={(event) => setSettings((current) => ({ ...current, paybillAccountName: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                    </div>
                    <Field label="Reference prefix" dark><input value={settings.paybillReferencePrefix} onChange={(event) => setSettings((current) => ({ ...current, paybillReferencePrefix: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                    <div className="rounded-[2rem] border border-white/10 bg-black/10 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300">Password reset email delivery</p>
                      <p className="mt-3 text-sm leading-7 text-stone-300">Connect EmailJS so shoppers receive their reset code in their inbox. Your template should accept: <span className="font-semibold text-white">to_email</span>, <span className="font-semibold text-white">to_name</span>, <span className="font-semibold text-white">reset_code</span>, <span className="font-semibold text-white">expires_at</span>, <span className="font-semibold text-white">store_name</span>, and <span className="font-semibold text-white">support_phone</span>.</p>
                      <div className="mt-4 grid gap-4">
                        <Field label="EmailJS service ID" dark><input value={settings.emailjsServiceId} onChange={(event) => setSettings((current) => ({ ...current, emailjsServiceId: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                        <Field label="EmailJS template ID" dark><input value={settings.emailjsTemplateId} onChange={(event) => setSettings((current) => ({ ...current, emailjsTemplateId: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                        <Field label="EmailJS public key" dark><input value={settings.emailjsPublicKey} onChange={(event) => setSettings((current) => ({ ...current, emailjsPublicKey: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                      </div>
                    </div>
                  </div>
                </form>
                <div className="grid gap-8">
                  <form onSubmit={changeAdminPassword} className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
                    <SectionTitle eyebrow="Security" title="Admin access controls" copy="Update the admin password and the quiz question that appears before the password screen." invert />
                    <div className="mt-6 grid gap-4">
                      <Field label="Quiz question" dark><input value={settings.adminQuizQuestion} onChange={(event) => setSettings((current) => ({ ...current, adminQuizQuestion: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                      <Field label="Quiz answer" dark><input value={settings.adminQuizAnswer} onChange={(event) => setSettings((current) => ({ ...current, adminQuizAnswer: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                      <Field label="Current admin password" dark><input type="password" value={adminPasswordForm.currentPassword} onChange={(event) => setAdminPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                      <Field label="New admin password" dark><input type="password" value={adminPasswordForm.newPassword} onChange={(event) => setAdminPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
                      {productError ? <p className="text-sm text-orange-300">{productError}</p> : null}
                      <button type="submit" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-stone-100">Update admin password</button>
                    </div>
                  </form>
                </div>
              </section>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  ) : (
    <div className="min-h-screen bg-stone-950 px-5 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl rounded-[2.75rem] border border-white/10 bg-white/5 p-8 text-white backdrop-blur sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-orange-300">Private access</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Admin panel</h1>
        <p className="mt-4 text-sm leading-7 text-stone-300">This area is protected. Complete the access step below to continue.</p>
        {adminStage === "quiz" ? (
          <form onSubmit={submitQuiz} className="mt-8 grid gap-4">
            <Field label={settings.adminQuizQuestion} dark><input value={quizAnswer} onChange={(event) => setQuizAnswer(event.target.value)} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
            {quizError ? <p className="text-sm text-orange-300">{quizError}</p> : null}
            <button type="submit" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-stone-100">Continue</button>
          </form>
        ) : (
          <form onSubmit={submitAdminPassword} className="mt-8 grid gap-4">
            <Field label="Admin password" dark><input type="password" value={adminPasswordInput} onChange={(event) => setAdminPasswordInput(event.target.value)} className={cls(INPUT_CLASS, "border-white/10 bg-white text-stone-900")} /></Field>
            {adminPasswordError ? <p className="text-sm text-orange-300">{adminPasswordError}</p> : null}
            <button type="submit" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-stone-100">Open dashboard</button>
          </form>
        )}
      </div>
    </div>
  );

  const cartPanel = page === "admin" ? null : (
    <AnimatePresence>
      {cartOpen ? (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" onClick={() => setCartOpen(false)} className="absolute inset-0 bg-black/55" aria-label="Close cart" />
          <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 180, damping: 24 }} className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-orange-500">Shopping cart</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">Your order</h2>
              </div>
              <button type="button" onClick={() => setCartOpen(false)} className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-900">Close</button>
            </div>
            {cartDetails.length ? (
              <div className="mt-8 space-y-6">
                {cartDetails.map((item) => (
                  <div key={`${item.product.id}-${item.size}-${item.color}`} className="rounded-[2rem] border border-stone-200 p-4">
                    <div className="flex gap-4">
                      <img src={item.product.images[0]} alt={item.product.name} className="h-24 w-24 rounded-full object-cover" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-stone-950">{item.product.name}</h3>
                            <p className="mt-1 text-sm text-stone-500">{item.color} / size {item.size}</p>
                          </div>
                          <p className="text-sm font-semibold text-stone-950">{formatCurrency(item.lineTotal)}</p>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 rounded-full border border-stone-200 px-2 py-1">
                            <button type="button" onClick={() => updateCartItem(item.index, item.quantity - 1)} className="h-9 w-9 rounded-full border border-stone-200 text-lg">-</button>
                            <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                            <button type="button" onClick={() => updateCartItem(item.index, item.quantity + 1)} className="h-9 w-9 rounded-full border border-stone-200 text-lg">+</button>
                          </div>
                          <button type="button" onClick={() => updateCartItem(item.index, 0)} className="rounded-full border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-900">Remove</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-[2rem] border border-stone-200 bg-stone-50 px-5 py-4 text-sm">
                  <button type="button" onClick={clearCart} className="rounded-full border border-stone-300 px-4 py-2 font-semibold text-stone-900">Clear cart</button>
                  <p className="text-lg font-semibold text-stone-950">Subtotal {formatCurrency(cartTotal)}</p>
                </div>
                {currentUser ? (
                  <form onSubmit={submitCheckout} className="rounded-[2rem] border border-stone-200 bg-stone-50 p-5">
                    <SectionTitle eyebrow="Checkout" title="Delivery details" copy="Place your order to create a branded invoice automatically and receive paybill details right away." />
                    <div className="mt-5 grid gap-4">
                      <Field label="Full name"><input value={checkoutForm.name} onChange={(event) => setCheckoutForm((current) => ({ ...current, name: event.target.value }))} className={INPUT_CLASS} /></Field>
                      <Field label="Phone number"><input value={checkoutForm.phone} onChange={(event) => setCheckoutForm((current) => ({ ...current, phone: event.target.value }))} className={INPUT_CLASS} /></Field>
                      <Field label="Delivery area"><input value={checkoutForm.location} onChange={(event) => setCheckoutForm((current) => ({ ...current, location: event.target.value }))} className={INPUT_CLASS} /></Field>
                      <Field label="Additional notes"><textarea value={checkoutForm.notes} onChange={(event) => setCheckoutForm((current) => ({ ...current, notes: event.target.value }))} className={TEXTAREA_CLASS} /></Field>
                    </div>
                    {checkoutError ? <p className="mt-4 text-sm text-red-500">{checkoutError}</p> : null}
                    <button type="submit" className="mt-5 w-full rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800">Place order and generate invoice</button>
                  </form>
                ) : (
                  <div className="rounded-[2rem] border border-orange-200 bg-orange-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.34em] text-orange-600">Account required</p>
                    <h3 className="mt-2 text-2xl font-semibold text-stone-950">Sign in before checkout</h3>
                    <p className="mt-3 text-sm leading-7 text-stone-600">To place an order, save your invoice, and track delivery updates, please sign in or create your account first.</p>
                    {checkoutError ? <p className="mt-4 text-sm text-red-500">{checkoutError}</p> : null}
                    <button type="button" onClick={() => requireCustomerLogin("place an order")} className="mt-5 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800">Sign in to continue</button>
                  </div>
                )}
              </div>
            ) : <div className="mt-8 rounded-[2rem] border border-stone-200 bg-stone-50 p-6 text-sm leading-7 text-stone-600">Your cart is empty. Add your preferred shoe, choose the size and color, then continue to checkout.</div>}
            {latestOrder && latestInvoice ? (
              <div className="mt-8 space-y-5">
                <div className="rounded-[2rem] border border-orange-300 bg-orange-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-orange-600">Order placed successfully</p>
                  <h3 className="mt-2 text-2xl font-semibold text-stone-950">{latestOrder.reference}</h3>
                  <div className="mt-4 space-y-2 text-sm text-stone-700">
                    <p>Paybill number: {settings.paybillNumber}</p>
                    <p>Account name: {settings.paybillAccountName}</p>
                    <p>Reference: {settings.paybillReferencePrefix}-{latestOrder.reference}</p>
                    <p>Amount: {formatCurrency(latestOrder.total)}</p>
                  </div>
                  <button type="button" onClick={() => copyText(`${settings.paybillNumber} | ${settings.paybillReferencePrefix}-${latestOrder.reference} | ${formatCurrency(latestOrder.total)}`, setCopiedPayment)} className="mt-5 rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-900">{copiedPayment ? "Copied" : "Copy payment details"}</button>
                </div>
                <InvoicePanel invoice={latestInvoice} status={latestOrder.status} settings={settings} copied={copiedInvoice} onCopy={() => copyText(buildInvoiceText(latestInvoice, settings, latestOrder.status), setCopiedInvoice)} onPrint={() => printInvoice(latestInvoice, settings, latestOrder.status)} />
              </div>
            ) : null}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  const accountModal = page === "admin" ? null : (
    <AnimatePresence>
      {authOpen ? (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" onClick={closeAuthPanel} className="absolute inset-0 bg-black/55" aria-label="Close account panel" />
          <motion.div initial={{ y: 26, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 26, opacity: 0 }} className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] border border-stone-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-orange-500">Customer account</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">{authView === "register" ? "Create your account" : authView === "account" ? "Your account" : authView === "forgot" ? "Reset your password" : authView === "reset" ? "Choose a new password" : "Sign in"}</h2>
              </div>
              <button type="button" onClick={closeAuthPanel} className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-900">Close</button>
            </div>
            <div className="mt-6 flex gap-2 border-b border-stone-200 pb-4 text-sm font-semibold">
              <button type="button" onClick={() => openAuthPanel("login")} className={cls("rounded-full px-3 py-2", authView === "login" && "bg-stone-100 text-stone-950")}>Sign in</button>
              <button type="button" onClick={() => openAuthPanel("register")} className={cls("rounded-full px-3 py-2", authView === "register" && "bg-stone-100 text-stone-950")}>Create account</button>
              {currentUser ? <button type="button" onClick={() => openAuthPanel("account")} className={cls("rounded-full px-3 py-2", authView === "account" && "bg-stone-100 text-stone-950")}>My account</button> : null}
            </div>
            {authError ? <p className="mt-4 text-sm text-red-500">{authError}</p> : null}
            {authMessage ? <p className="mt-4 text-sm text-emerald-600">{authMessage}</p> : null}
            {authView === "login" ? (
              <form onSubmit={loginUser} className="mt-6 grid gap-4">
                <Field label="Email address"><input value={loginForm.email} onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))} className={INPUT_CLASS} /></Field>
                <Field label="Password"><input type="password" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} className={INPUT_CLASS} /></Field>
                <button type="submit" className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800">Sign in</button>
                <button type="button" onClick={() => openAuthPanel("forgot")} className="justify-self-start text-sm font-semibold text-stone-500 transition hover:text-stone-950">Forgot your password?</button>
              </form>
            ) : null}
            {authView === "register" ? (
              <form onSubmit={registerUser} className="mt-6 grid gap-4">
                <Field label="Full name"><input value={registerForm.name} onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))} className={INPUT_CLASS} /></Field>
                <Field label="Email address"><input value={registerForm.email} onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))} className={INPUT_CLASS} /></Field>
                <Field label="Phone number"><input value={registerForm.phone} onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))} className={INPUT_CLASS} /></Field>
                <Field label="Password"><input type="password" value={registerForm.password} onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))} className={INPUT_CLASS} /></Field>
                <button type="submit" className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800">Create account</button>
              </form>
            ) : null}
            {authView === "forgot" ? (
              <form onSubmit={sendPasswordResetCode} className="mt-6 grid gap-4">
                <p className="text-sm leading-7 text-stone-600">Enter your account email address and we will send a verification code to your inbox so you can reset your password securely.</p>
                <Field label="Email address"><input value={forgotPasswordEmail} onChange={(event) => setForgotPasswordEmail(event.target.value)} className={INPUT_CLASS} /></Field>
                <button type="submit" disabled={sendingResetEmail} className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400">{sendingResetEmail ? "Sending email..." : "Email reset code"}</button>
              </form>
            ) : null}
            {authView === "reset" ? (
              <form onSubmit={resetUserPassword} className="mt-6 grid gap-4">
                <p className="text-sm leading-7 text-stone-600">Confirm your email address, enter the verification code from your inbox, and choose a fresh password for your account.</p>
                {passwordResetRequest ? (
                  <div className="rounded-[1.75rem] border border-orange-200 bg-orange-50 px-4 py-3 text-sm leading-7 text-stone-700">
                    <p className="font-semibold text-stone-950">Check your email</p>
                    <p>We sent a password reset code to <span className="font-semibold">{passwordResetRequest.email}</span>. Enter it before {new Date(passwordResetRequest.expiresAt).toLocaleTimeString()}.</p>
                  </div>
                ) : null}
                <Field label="Email address"><input value={passwordResetForm.email} onChange={(event) => setPasswordResetForm((current) => ({ ...current, email: event.target.value }))} className={INPUT_CLASS} /></Field>
                <Field label="Verification code"><input value={passwordResetForm.code} onChange={(event) => setPasswordResetForm((current) => ({ ...current, code: event.target.value }))} className={INPUT_CLASS} /></Field>
                <Field label="New password"><input type="password" value={passwordResetForm.newPassword} onChange={(event) => setPasswordResetForm((current) => ({ ...current, newPassword: event.target.value }))} className={INPUT_CLASS} /></Field>
                <div className="flex flex-wrap gap-3">
                  <button type="submit" className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800">Update password</button>
                  <button type="button" onClick={() => openAuthPanel("forgot")} className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-900 transition hover:border-stone-950">Request a new code</button>
                </div>
              </form>
            ) : null}
            {authView === "account" && currentUser ? (
              <div className="mt-6 space-y-6">
                <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5 text-sm leading-7 text-stone-700"><p className="font-semibold text-stone-950">{currentUser.name}</p><p>{currentUser.email}</p><p>{currentUser.phone || "No phone number saved"}</p></div>
                <form onSubmit={changeUserPassword} className="grid gap-4">
                  <Field label="Current password"><input type="password" value={accountPasswordForm.currentPassword} onChange={(event) => setAccountPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} className={INPUT_CLASS} /></Field>
                  <Field label="New password"><input type="password" value={accountPasswordForm.newPassword} onChange={(event) => setAccountPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} className={INPUT_CLASS} /></Field>
                  <button type="submit" className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800">Change password</button>
                </form>
                {myOrders.length ? <div><p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">Recent orders</p><div className="mt-4 space-y-3">{myOrders.slice(0, 3).map((order) => <div key={order.id} className="rounded-[1.5rem] border border-stone-200 p-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-stone-950">{order.reference}</p><p className="text-stone-500">{formatCurrency(order.total)}</p></div><StatusBadge status={order.status} /></div></div>)}</div></div> : null}
                <button type="button" onClick={logoutUser} className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-900 transition hover:border-stone-950">Sign out</button>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  const chatPanel = page === "admin" ? null : (
    <>
      <div className="fixed bottom-5 right-5 z-30">
        <button type="button" onClick={() => setChatOpen(true)} className="rounded-full border border-emerald-400/60 bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_60px_-24px_rgba(16,185,129,0.9)] transition hover:bg-emerald-600">Chat with us</button>
      </div>
      <AnimatePresence>
        {chatOpen ? (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" onClick={() => setChatOpen(false)} className="absolute inset-0 bg-black/40" aria-label="Close chat panel" />
            <motion.aside initial={{ x: 32, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 32, opacity: 0 }} className="absolute bottom-5 right-5 w-[calc(100%-2.5rem)] max-w-xl rounded-[2.25rem] border border-emerald-200 bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-emerald-600">Customer support</p>
                  <h2 className="mt-2 text-2xl font-semibold text-stone-950">Chat with Claddie KENYA</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">Ask about products, payment, delivery, or your order reference and we will assist you promptly.</p>
                </div>
                <button type="button" onClick={() => setChatOpen(false)} className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-stone-900 transition hover:border-emerald-400">Close</button>
              </div>
              <div className="mt-5 max-h-72 space-y-3 overflow-y-auto rounded-[1.75rem] border border-emerald-100 bg-emerald-50/60 p-4">
                {customerMessages.length ? customerMessages.map((message) => <div key={message.id} className={cls("max-w-[85%] rounded-[1.5rem] px-4 py-3 text-sm leading-7 shadow-sm", message.senderType === "admin" ? "ml-auto border border-emerald-500 bg-emerald-500 text-white" : "border border-emerald-100 bg-white text-stone-700")}><p className="font-semibold">{message.senderName}</p><p className="mt-1">{message.message}</p><p className={cls("mt-2 text-xs", message.senderType === "admin" ? "text-emerald-50/80" : "text-stone-500")}>{new Date(message.createdAt).toLocaleString()}</p></div>) : <p className="text-sm leading-7 text-stone-500">Start a conversation about a product, payment, delivery, or an order reference.</p>}
              </div>
              {currentUser ? (
                <form onSubmit={submitCustomerChat} className="mt-5 grid gap-4">
                  <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-stone-700">
                    Signed in as <span className="font-semibold text-stone-950">{currentUser.name}</span>
                  </div>
                  <Field label="Order reference"><input value={customerChatForm.orderReference} onChange={(event) => setCustomerChatForm((current) => ({ ...current, orderReference: event.target.value }))} placeholder="Optional" className="h-12 w-full rounded-full border border-emerald-200 bg-white px-4 text-sm text-stone-900 outline-none transition focus:border-emerald-500" /></Field>
                  <Field label="Message"><textarea value={customerChatForm.message} onChange={(event) => setCustomerChatForm((current) => ({ ...current, message: event.target.value }))} className="min-h-28 w-full rounded-[1.5rem] border border-emerald-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500" /></Field>
                  {chatError ? <p className="text-sm text-red-500">{chatError}</p> : null}
                  {chatSuccess ? <p className="text-sm text-emerald-600">{chatSuccess}</p> : null}
                  <button type="submit" className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600">Send message</button>
                </form>
              ) : (
                <div className="mt-5 rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-emerald-700">Account required</p>
                  <h3 className="mt-2 text-xl font-semibold text-stone-950">Sign in to message the store</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-600">Customer chat is available to signed-in shoppers so your questions, order updates, and replies stay connected to your account.</p>
                  {chatError ? <p className="mt-4 text-sm text-red-500">{chatError}</p> : null}
                  <button type="button" onClick={() => requireCustomerLogin("send a message")} className="mt-5 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600">Sign in to chat</button>
                </div>
              )}
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );

  const pages: Record<Page, ReactNode> = { home: homePage, shop: shopPage, admin: adminGate };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-950">
      {navigation}
      <AnimatePresence mode="wait">
        <motion.div key={page} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
          {pages[page]}
        </motion.div>
      </AnimatePresence>
      {publicFooter}
      {cartPanel}
      {accountModal}
      {chatPanel}
    </div>
  );
}