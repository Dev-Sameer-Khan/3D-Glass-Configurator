import { useMemo, useState } from 'react';
import {
  Calculator,
  Check,
  FileText,
  HardHat,
  Layers,
  Ruler,
  Settings2,
  Square,
  WalletCards,
} from 'lucide-react';
import {
  BRAND,
  DEFAULT_ESTIMATE,
  GLASS_RATES,
  GLASS_THICKNESSES,
  GLASS_TYPES,
  HARDWARE_COSTS,
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
  TAX_PERCENT,
} from './constants';
import LivePreview from './LivePreview';
import QuoteModal from './QuoteModal';

type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
type ProductType = (typeof PRODUCT_TYPES)[number];
type GlassType = (typeof GLASS_TYPES)[number];
type GlassThickness = (typeof GLASS_THICKNESSES)[number];
type HardwareName = keyof typeof HARDWARE_COSTS;

type EstimatorState = {
  category: ProductCategory;
  type: ProductType;
  widthMm: number;
  heightMm: number;
  glassType: GlassType;
  thickness: GlassThickness;
  wastagePercent: number;
  laborCharge: number;
  selectedHardware: Record<HardwareName, boolean>;
};

const SQ_MM_IN_SQ_FT = 92903.04;

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

function mmToSqFt(widthMm: number, heightMm: number) {
  return (widthMm * heightMm) / SQ_MM_IN_SQ_FT;
}

function toCurrency(value: number) {
  return INR_FORMATTER.format(value);
}

export default function EstimatorApp() {
  const [form, setForm] = useState<EstimatorState>({
    ...DEFAULT_ESTIMATE,
  });
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteId, setQuoteId] = useState('Q-100001');

  const ratePerSqFt =
    GLASS_RATES[form.category][form.type][form.glassType][form.thickness];

  const calculation = useMemo(() => {
    const areaSqFt = mmToSqFt(form.widthMm, form.heightMm);
    const glassCost = areaSqFt * ratePerSqFt;
    const hardwareCost = (Object.keys(form.selectedHardware) as HardwareName[])
      .filter((name) => form.selectedHardware[name])
      .reduce((total, name) => total + HARDWARE_COSTS[name], 0);

    const subtotal = glassCost + hardwareCost;
    const wastageCost = (subtotal * form.wastagePercent) / 100;
    const taxableAmount = subtotal + wastageCost + form.laborCharge;
    const taxAmount = (taxableAmount * TAX_PERCENT) / 100;
    const grandTotal = taxableAmount + taxAmount;

    return {
      areaSqFt,
      glassCost,
      hardwareCost,
      subtotal,
      wastageCost,
      taxableAmount,
      taxAmount,
      grandTotal,
    };
  }, [form, ratePerSqFt]);

  const updateField = <K extends keyof EstimatorState>(
    key: K,
    value: EstimatorState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 to-slate-200 p-4 text-slate-900 md:p-8">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-slate-300/70 bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Glass & Hardware Estimator
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Modern industrial quote builder with live visual preview.
              </p>
            </div>
            <div className="rounded-xl p-2 text-white" style={{ backgroundColor: BRAND.accentColor }}>
              <Calculator size={20} />
            </div>
          </div>

          <div className="space-y-6">
            <LivePreview widthMm={form.widthMm} heightMm={form.heightMm} type={form.type} />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Layers size={16} /> Product Category
                </span>
                <select
                  value={form.category}
                  onChange={(event) =>
                    updateField('category', event.target.value as ProductCategory)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
                >
                  {PRODUCT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Settings2 size={16} /> Type
                </span>
                <select
                  value={form.type}
                  onChange={(event) =>
                    updateField('type', event.target.value as ProductType)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
                >
                  {PRODUCT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Ruler size={16} /> Width (MM)
                </span>
                <input
                  type="number"
                  min={300}
                  value={form.widthMm}
                  onChange={(event) =>
                    updateField('widthMm', Math.max(0, Number(event.target.value) || 0))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
                />
              </label>

              <label className="space-y-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Square size={16} /> Height (MM)
                </span>
                <input
                  type="number"
                  min={300}
                  value={form.heightMm}
                  onChange={(event) =>
                    updateField('heightMm', Math.max(0, Number(event.target.value) || 0))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium">Glass Type</span>
                <select
                  value={form.glassType}
                  onChange={(event) =>
                    updateField('glassType', event.target.value as GlassType)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
                >
                  {GLASS_TYPES.map((glassType) => (
                    <option key={glassType} value={glassType}>
                      {glassType}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Thickness</span>
                <select
                  value={form.thickness}
                  onChange={(event) =>
                    updateField('thickness', event.target.value as GlassThickness)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
                >
                  {GLASS_THICKNESSES.map((thickness) => (
                    <option key={thickness} value={thickness}>
                      {thickness}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <HardHat size={16} /> Hardware Selection
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.keys(HARDWARE_COSTS) as HardwareName[]).map((name) => {
                  const selected = form.selectedHardware[name];
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() =>
                        updateField('selectedHardware', {
                          ...form.selectedHardware,
                          [name]: !selected,
                        })
                      }
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium transition ${
                        selected
                          ? 'border-blue-900 bg-blue-900 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <span>{name}</span>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          selected ? 'border-white/80 bg-white/20' : 'border-slate-300'
                        }`}
                      >
                        {selected ? <Check size={12} /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium">Wastage (%)</span>
                <input
                  type="number"
                  min={0}
                  value={form.wastagePercent}
                  onChange={(event) =>
                    updateField('wastagePercent', Math.max(0, Number(event.target.value) || 0))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Labor Charge (INR)</span>
                <input
                  type="number"
                  min={0}
                  value={form.laborCharge}
                  onChange={(event) =>
                    updateField('laborCharge', Math.max(0, Number(event.target.value) || 0))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
                />
              </label>
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-slate-300/70 bg-slate-950 p-5 text-slate-100 shadow-sm md:p-6 lg:sticky lg:top-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Live Quote Card</h2>
            <WalletCards size={18} className="text-slate-400" />
          </div>

          <div className="space-y-3 text-sm">
            <QuoteRow label="Category" value={form.category} />
            <QuoteRow label="Type" value={form.type} />
            <QuoteRow label="Glass" value={`${form.glassType} (${form.thickness})`} />
            <QuoteRow label="Rate / Sq. Ft." value={`Rs ${toCurrency(ratePerSqFt)}`} />
            <QuoteRow label="Area (Sq. Ft.)" value={calculation.areaSqFt.toFixed(2)} />
            <QuoteRow label="Glass Cost" value={`Rs ${toCurrency(calculation.glassCost)}`} />
            <QuoteRow
              label="Hardware Cost"
              value={`Rs ${toCurrency(calculation.hardwareCost)}`}
            />
            <QuoteRow label="Subtotal" value={`Rs ${toCurrency(calculation.subtotal)}`} />
            <QuoteRow
              label={`Wastage (${form.wastagePercent}%)`}
              value={`Rs ${toCurrency(calculation.wastageCost)}`}
            />
            <QuoteRow label="Labor" value={`Rs ${toCurrency(form.laborCharge)}`} />
            <QuoteRow label={`GST (${TAX_PERCENT}%)`} value={`Rs ${toCurrency(calculation.taxAmount)}`} />
          </div>

          <div className="mt-6 rounded-xl bg-white px-4 py-3 text-slate-900">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Grand Total
            </p>
            <p className="mt-1 text-2xl font-semibold">
              Rs {toCurrency(calculation.grandTotal)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setQuoteId(`Q-${Date.now().toString().slice(-6)}`);
              setIsQuoteModalOpen(true);
            }}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            <FileText size={16} />
            Generate Quote
          </button>
        </aside>
      </div>

      <QuoteModal
        open={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        quoteId={quoteId}
        form={form}
        calculation={{
          ...calculation,
          ratePerSqFt,
        }}
        currency={toCurrency}
      />
    </div>
  );
}

function QuoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
