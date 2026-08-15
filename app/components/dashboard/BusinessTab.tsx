"use client";

import { useState, useTransition, type ReactNode } from "react";
import { removeBusiness, saveBusiness } from "@/app/dashboard/actions";
import { fieldInput, ghostButton, primaryButton } from "@/lib/dashboard-ui";
import {
  businessToInput,
  emptyBusinessInput,
  type Business,
  type BusinessInput,
} from "@/lib/workspace-types";

export function BusinessTab({
  businesses,
  selectedBusinessId,
  onSelectBusiness,
  onBusinessesChange,
}: {
  businesses: Business[];
  selectedBusinessId: string | null;
  onSelectBusiness: (id: string) => void;
  onBusinessesChange: (businesses: Business[]) => void;
}) {
  const [creating, setCreating] = useState(businesses.length === 0);
  const current = creating
    ? null
    : businesses.find((business) => business.id === selectedBusinessId) ??
      businesses[0];

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-[65ch] text-[14px] leading-6 text-secondary">
          The company Tack writes against. Scan a URL once; reopen it here
          instead of starting from a blank paste.
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className={ghostButton}
        >
          Add business
        </button>
      </div>

      {businesses.length > 1 && !creating ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {businesses.map((business) => {
            const active = business.id === current?.id;
            return (
              <button
                key={business.id}
                type="button"
                onClick={() => onSelectBusiness(business.id)}
                className={`rounded-lg border px-3 py-1.5 text-[13px] transition-colors ${
                  active
                    ? "border-white/20 bg-white/8 text-white"
                    : "border-white/8 text-secondary hover:border-white/15 hover:text-white"
                }`}
              >
                {business.name}
              </button>
            );
          })}
        </div>
      ) : null}

      <BusinessForm
        key={creating ? "new" : current?.id ?? "empty"}
        business={creating ? null : current ?? null}
        onCancel={creating && businesses.length > 0 ? () => setCreating(false) : undefined}
        onSaved={(saved) => {
          const next = creating
            ? [saved, ...businesses.filter((item) => item.id !== saved.id)]
            : businesses.map((item) => (item.id === saved.id ? saved : item));
          onBusinessesChange(next);
          setCreating(false);
          onSelectBusiness(saved.id);
        }}
        onDeleted={
          current
            ? () => {
                const next = businesses.filter((item) => item.id !== current.id);
                onBusinessesChange(next);
                if (next[0]) onSelectBusiness(next[0].id);
              }
            : undefined
        }
      />
    </div>
  );
}

function BusinessForm({
  business,
  onSaved,
  onDeleted,
  onCancel,
}: {
  business: Business | null;
  onSaved: (business: Business) => void;
  onDeleted?: () => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<BusinessInput>(
    business ? businessToInput(business) : emptyBusinessInput(),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const setField = <K extends keyof BusinessInput>(key: K, value: BusinessInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  return (
    <form
      className="zh-panel mt-6 space-y-4 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          const result = await saveBusiness(form, business?.id);
          if ("error" in result) {
            setError(result.error);
            return;
          }
          onSaved(result);
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company">
          <input
            value={form.name}
            onChange={(event) => setField("name", event.target.value)}
            className={fieldInput}
            placeholder="Linear"
            required
          />
        </Field>
        <Field label="Website">
          <input
            value={form.website}
            onChange={(event) => setField("website", event.target.value)}
            className={fieldInput}
            placeholder="linear.app"
            required
          />
        </Field>
      </div>
      <Field label="Niche">
        <input
          value={form.niche}
          onChange={(event) => setField("niche", event.target.value)}
          className={fieldInput}
          placeholder="Issue tracking for product teams"
        />
      </Field>
      <Field label="Audience">
        <textarea
          value={form.audience}
          onChange={(event) => setField("audience", event.target.value)}
          className={`${fieldInput} min-h-24 resize-y`}
          placeholder="Engineering leads who are tired of Jira"
        />
      </Field>
      <Field label="Competitors" hint="comma-separated">
        <input
          value={form.competitors}
          onChange={(event) => setField("competitors", event.target.value)}
          className={fieldInput}
          placeholder="Jira, Asana, Height"
        />
      </Field>

      {error ? (
        <p role="alert" className="text-[13px] text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : business ? "Save business" : "Add business"}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className={ghostButton}>
            Cancel
          </button>
        ) : null}
        {business && onDeleted ? (
          <button
            type="button"
            className="ml-auto text-[13px] text-tertiary transition-colors hover:text-red-300"
            onClick={() => {
              start(async () => {
                const result = await removeBusiness(business.id);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                onDeleted();
              });
            }}
          >
            Remove
          </button>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline gap-1.5">
        <span className="text-[12px] font-medium text-white">{label}</span>
        {hint ? <span className="text-[11px] text-tertiary">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}
