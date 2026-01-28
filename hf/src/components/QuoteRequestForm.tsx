"use client";

import { useState } from "react";

type ClientOption = { id: string; name: string };
type UserOption = { id: string; name: string };

type QuoteItemDraft = {
  description: string;
  qty: number;
};

export default function QuoteRequestForm({
  clients,
  salesUsers,
  action,
}: {
  clients: ClientOption[];
  salesUsers: UserOption[];
  action: (formData: FormData) => void;
}) {
  const [items, setItems] = useState<QuoteItemDraft[]>([
    { description: "", qty: 1 },
  ]);

  const updateItem = (index: number, field: keyof QuoteItemDraft, value: string) => {
    setItems((current) =>
      current.map((item, idx) =>
        idx === index
          ? { ...item, [field]: field === "qty" ? Number(value) : value }
          : item,
      ),
    );
  };

  const addItem = () => {
    setItems((current) => [...current, { description: "", qty: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems((current) => current.filter((_, idx) => idx !== index));
  };

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Client
          <select
            name="clientId"
            required
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Select client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Sales Owner
          <select
            name="salesOwnerId"
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Unassigned</option>
            {salesUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Initial Items</h2>
          <button
            type="button"
            onClick={addItem}
            className="rounded-md border border-slate-200 px-3 py-1 text-xs hover:bg-slate-100"
          >
            Add item
          </button>
        </div>
        {items.map((item, index) => (
          <div
            key={`item-${index}`}
            className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-[2fr_1fr_auto]"
          >
            <label className="text-xs font-medium text-slate-600">
              Description
              <input
                type="text"
                value={item.description}
                onChange={(event) =>
                  updateItem(index, "description", event.target.value)
                }
                required
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Qty
              <input
                type="number"
                min={1}
                value={item.qty}
                onChange={(event) => updateItem(index, "qty", event.target.value)}
                required
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-500 hover:bg-slate-100"
                disabled={items.length === 1}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="submit"
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Create request
      </button>
    </form>
  );
}
