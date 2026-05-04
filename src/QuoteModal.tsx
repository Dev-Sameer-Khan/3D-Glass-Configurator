import { Download, FileText, X } from 'lucide-react';
import { BRAND, TAX_PERCENT } from './constants';

type QuoteModalProps = {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  form: {
    category: string;
    type: string;
    widthMm: number;
    heightMm: number;
    glassType: string;
    thickness: string;
    wastagePercent: number;
    laborCharge: number;
  };
  calculation: {
    areaSqFt: number;
    ratePerSqFt: number;
    glassCost: number;
    hardwareCost: number;
    subtotal: number;
    wastageCost: number;
    taxableAmount: number;
    taxAmount: number;
    grandTotal: number;
  };
  currency: (value: number) => string;
};

export default function QuoteModal({
  open,
  onClose,
  quoteId,
  form,
  calculation,
  currency,
}: QuoteModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2 text-slate-700">
            <FileText size={18} />
            <h3 className="text-base font-semibold">Professional Print View</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-6 p-5 md:p-8">
          <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 md:flex-row">
            <div>
              <h2 className="text-2xl font-semibold" style={{ color: BRAND.accentColor }}>
                {BRAND.businessName}
              </h2>
              <p className="text-sm text-slate-500">{BRAND.address}</p>
              <p className="text-sm text-slate-500">
                {BRAND.phone} • {BRAND.email}
              </p>
            </div>
            <div className="text-sm text-slate-600">
              <p>
                <span className="font-semibold">Quote #:</span> {quoteId}
              </p>
              <p>
                <span className="font-semibold">Date:</span>{' '}
                {new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
          </header>

          <section className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-2">
            <p>
              <span className="font-semibold">Category:</span> {form.category}
            </p>
            <p>
              <span className="font-semibold">Type:</span> {form.type}
            </p>
            <p>
              <span className="font-semibold">Dimensions:</span> {form.widthMm}mm x {form.heightMm}
              mm
            </p>
            <p>
              <span className="font-semibold">Glass:</span> {form.glassType} ({form.thickness})
            </p>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                <tr>
                  <td className="px-4 py-3">
                    Glass ({calculation.areaSqFt.toFixed(2)} Sq. Ft. x Rs{' '}
                    {currency(calculation.ratePerSqFt)})
                  </td>
                  <td className="px-4 py-3 text-right">Rs {currency(calculation.glassCost)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Hardware</td>
                  <td className="px-4 py-3 text-right">Rs {currency(calculation.hardwareCost)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Wastage ({form.wastagePercent}%)</td>
                  <td className="px-4 py-3 text-right">Rs {currency(calculation.wastageCost)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Labor</td>
                  <td className="px-4 py-3 text-right">Rs {currency(form.laborCharge)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="ml-auto w-full max-w-sm space-y-2 text-sm">
            <SummaryRow label="Taxable Amount" value={`Rs ${currency(calculation.taxableAmount)}`} />
            <SummaryRow
              label={`GST (${TAX_PERCENT}%)`}
              value={`Rs ${currency(calculation.taxAmount)}`}
            />
            <div className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2 font-semibold text-white">
              <span>Grand Total</span>
              <span>Rs {currency(calculation.grandTotal)}</span>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => window.alert('PDF download will be connected in the next step.')}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Download size={16} /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-slate-700">
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
