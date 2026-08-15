"use client";

import { useState, useTransition } from "react";
import { removeProduct, saveProduct } from "@/app/dashboard/actions";
import { fieldInput, ghostButton, primaryButton } from "@/lib/dashboard-ui";
import type { Business, Product, ProductInput } from "@/lib/workspace-types";

export function ProductsTab({
  business,
  initialProducts,
  onProductsChange,
}: {
  business: Business;
  initialProducts: Product[];
  onProductsChange: (products: Product[]) => void;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const commit = (next: Product[]) => {
    setProducts(next);
    onProductsChange(next);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-[65ch] text-[14px] leading-6 text-secondary">
          What {business.name} actually sells. Revisit these before the next
          sprint so outreach names a real offer.
        </p>
        <button type="button" onClick={() => setEditing("new")} className={primaryButton}>
          Add product
        </button>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-[13px] text-red-200"
        >
          {error}
        </p>
      ) : null}

      {editing ? (
        <ProductForm
          businessId={business.id}
          product={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={(saved) => {
            commit(
              editing === "new"
                ? [saved, ...products]
                : products.map((item) => (item.id === saved.id ? saved : item)),
            );
            setEditing(null);
          }}
        />
      ) : null}

      {products.length === 0 && !editing ? (
        <div className="zh-panel mt-6 p-8">
          <h2 className="text-[18px] font-medium text-white">No products yet</h2>
          <p className="mt-2 max-w-[65ch] text-[14px] leading-6 text-secondary">
            Add the SKU, plan, or service the sprint should sell. You can open
            this list any time — it stays with the business.
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-white/6 overflow-hidden rounded-xl border border-white/8">
          {products.map((product) => (
            <li key={product.id} className="bg-[#0c0d0e] px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-[15px] font-medium text-white">{product.name}</h3>
                  {product.price ? (
                    <p className="mt-1 font-mono text-[12px] text-tertiary">{product.price}</p>
                  ) : null}
                  {product.description ? (
                    <p className="mt-2 max-w-[65ch] text-[13px] leading-5 text-secondary">
                      {product.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(product)}
                    className="text-[12px] text-secondary hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await removeProduct(product.id);
                      if (result.error) {
                        setError(result.error);
                        return;
                      }
                      commit(products.filter((item) => item.id !== product.id));
                    }}
                    className="text-[12px] text-tertiary hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductForm({
  businessId,
  product,
  onSaved,
  onCancel,
}: {
  businessId: string;
  product: Product | null;
  onSaved: (product: Product) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ProductInput>({
    name: product?.name ?? "",
    price: product?.price ?? "",
    description: product?.description ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="zh-panel mt-6 space-y-4 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          const result = await saveProduct(businessId, form, product?.id);
          if ("error" in result) {
            setError(result.error);
            return;
          }
          onSaved(result);
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-[12px] font-medium text-white">Name</span>
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className={fieldInput}
            placeholder="Tack Desk"
            required
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[12px] font-medium text-white">Price</span>
          <input
            value={form.price}
            onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
            className={fieldInput}
            placeholder="$20/mo"
          />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="text-[12px] font-medium text-white">What it is</span>
        <textarea
          value={form.description}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, description: event.target.value }))
          }
          className={`${fieldInput} min-h-24 resize-y`}
          placeholder="Competitor teardown, 10 outreach lines, one next move."
        />
      </label>
      {error ? (
        <p role="alert" className="text-[13px] text-red-300">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : product ? "Save product" : "Add product"}
        </button>
        <button type="button" onClick={onCancel} className={ghostButton}>
          Cancel
        </button>
      </div>
    </form>
  );
}
