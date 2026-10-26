import { ArrowRight, Check, Trash2, X } from 'lucide-react';
import { ProductItem } from '../utils/commerce';
import { COMPARISON_SPEC_ROWS } from '../utils/comparison';
import { ElvoraEmblem } from './ElvoraLogo';
import { ProductMedia } from './ProductMedia';

interface ProductCompareModalProps {
  isOpen: boolean;
  comparedProducts: ProductItem[];
  allProducts: ProductItem[];
  formatPrice: (amountUsd: number) => string;
  onClose: () => void;
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
  onSelectProductToCompare: (productId: string) => void;
  onAddToCart: (product: ProductItem, quantity?: number, openDrawer?: boolean) => void;
}

export function ProductCompareModal({
  isOpen,
  comparedProducts,
  allProducts,
  formatPrice,
  onClose,
  onRemoveProduct,
  onClearAll,
  onSelectProductToCompare,
  onAddToCart,
}: ProductCompareModalProps) {
  if (!isOpen) return null;

  const availableToAdd = allProducts.filter(
    (p) => p.isPublished && !comparedProducts.some((cp) => cp.id === p.id)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-6"
    >
      <div className="elv-card relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl border border-[var(--elv-border-strong)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--elv-border)] pb-4">
          <div className="flex items-center gap-3">
            <ElvoraEmblem size="sm" />
            <div>
              <h2
                id="compare-modal-title"
                className="font-display text-lg sm:text-xl font-bold text-[var(--elv-text-strong)]"
              >
                Hardware Specifications Matrix
              </h2>
              <p className="text-xs text-[var(--elv-text-muted)]">
                Side-by-side comparison of {comparedProducts.length} Elvora OEM electronics &amp; combos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {comparedProducts.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="elv-btn-outline inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--elv-text-muted)] hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Clear Matrix</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close comparison matrix"
              className="elv-btn-outline flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {comparedProducts.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <p className="font-display text-base font-semibold text-[var(--elv-text-strong)]">
              No devices selected for comparison
            </p>
            <p className="text-xs text-[var(--elv-text-muted)] max-w-md mx-auto">
              Select 2 or 3 items in the catalog using the Compare button on each product card to review specs, audio drivers, battery, and pricing side by side.
            </p>
            {availableToAdd.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {availableToAdd.slice(0, 3).map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => onSelectProductToCompare(prod.id)}
                    className="elv-btn-outline rounded-lg px-3 py-1.5 text-xs font-semibold hover:border-[var(--elv-text-gold)] hover:text-[var(--elv-text-gold)]"
                  >
                    + Add {prod.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Top Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-b border-[var(--elv-border)] pb-6">
              {comparedProducts.map((product) => {
                const outOfStock = product.stockRemaining <= 0;
                return (
                  <div
                    key={product.id}
                    className="elv-panel relative flex flex-col justify-between rounded-xl p-4 border border-[var(--elv-border)]"
                  >
                    <button
                      type="button"
                      onClick={() => onRemoveProduct(product.id)}
                      aria-label={`Remove ${product.title} from comparison`}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-[var(--elv-text-muted)] hover:text-red-400 hover:bg-black/90 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>

                    <div className="space-y-3">
                      <div className="h-28 w-full overflow-hidden rounded-lg border border-[var(--elv-border)]">
                        <ProductMedia
                          imageKey={product.imageKey}
                          alt={product.title}
                          aspectClass="h-full w-full"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--elv-text-gold)]">
                          {product.isCombo ? 'Combo Bundle' : product.category}
                        </span>
                        <h3 className="font-display text-sm font-semibold text-[var(--elv-text-strong)] line-clamp-1">
                          {product.title}
                        </h3>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[var(--elv-border)] space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-base font-bold text-[var(--elv-text-gold)] tabular-nums">
                          {formatPrice(product.price)}
                        </span>
                        {product.originalPrice && (
                          <span className="font-mono text-xs line-through text-[var(--elv-text-muted)] tabular-nums">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={outOfStock}
                        onClick={() => onAddToCart(product, 1, true)}
                        className="elv-btn-gold w-full min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 whitespace-nowrap"
                      >
                        {outOfStock ? 'Sold Out' : 'Add to Bag'}
                      </button>
                    </div>
                  </div>
                );
              })}

              {comparedProducts.length < 3 && availableToAdd.length > 0 && (
                <div className="elv-panel flex flex-col items-center justify-center rounded-xl p-6 border-2 border-dashed border-[var(--elv-border)] text-center space-y-3">
                  <p className="text-xs font-medium text-[var(--elv-text-muted)]">
                    Add another model to compare ({comparedProducts.length}/3)
                  </p>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        onSelectProductToCompare(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="elv-input text-xs w-full max-w-[200px] rounded-lg px-2.5 py-1.5"
                  >
                    <option value="" disabled>
                      Select model...
                    </option>
                    {availableToAdd.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} (${p.price})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Spec Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <tbody>
                  {COMPARISON_SPEC_ROWS.map((row, idx) => (
                    <tr
                      key={row.key}
                      className={idx % 2 === 0 ? 'bg-[var(--elv-surface)]' : 'bg-transparent'}
                    >
                      <th
                        scope="row"
                        className="p-3.5 font-semibold text-[var(--elv-text-gold)] whitespace-nowrap align-top w-48 border-b border-[var(--elv-border)]"
                      >
                        {row.label}
                      </th>
                      {comparedProducts.map((prod) => (
                        <td
                          key={prod.id}
                          className="p-3.5 text-[var(--elv-text-body)] border-b border-[var(--elv-border)] align-top leading-relaxed"
                        >
                          {row.getValue(prod)}
                        </td>
                      ))}
                      {comparedProducts.length < 3 && <td className="border-b border-[var(--elv-border)]" />}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
