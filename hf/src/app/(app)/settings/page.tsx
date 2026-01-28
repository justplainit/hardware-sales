import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/permissions";
import { getSetting } from "@/lib/settings";
import { updateSettingsAction } from "@/app/actions/admin-actions";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  requireRole(session, ["ADMIN"]);

  const minMargin = await getSetting("min_margin_pct", "15");
  const vatRate = await getSetting("vat_rate", "0.15");
  const notifyAdmin = (await getSetting("notify_admin_on_grn", "true")) === "true";

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      <form
        action={updateSettingsAction}
        className="rounded-lg border border-slate-200 bg-white p-6 space-y-4"
      >
        <label className="block text-sm font-medium text-slate-700">
          Minimum margin %
          <input
            name="minMargin"
            type="number"
            min={0}
            step="0.1"
            defaultValue={minMargin}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          VAT rate (decimal)
          <input
            name="vatRate"
            type="number"
            min={0}
            step="0.01"
            defaultValue={vatRate}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="notifyAdminOnGrn"
            defaultChecked={notifyAdmin}
          />
          Notify admin on GRN
        </label>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save settings
        </button>
      </form>
    </div>
  );
}
