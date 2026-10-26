import { FormEvent, useMemo, useState } from 'react';
import { Check, MessageSquarePlus, Star } from 'lucide-react';
import {
  CustomerReview,
  ProductItem,
  ReviewFormInput,
  validateReviewInput,
} from '../utils/commerce';

interface ReviewsViewProps {
  reviews: CustomerReview[];
  products: ProductItem[];
  businessName: string;
  onSubmitReview: (input: ReviewFormInput) => Promise<void>;
  onAddToCart: (product: ProductItem, quantity?: number, openDrawer?: boolean) => void;
}

export function ReviewsView({
  reviews,
  products,
  businessName,
  onSubmitReview,
  onAddToCart,
}: ReviewsViewProps) {
  const publishedProducts = useMemo(
    () => products.filter((p) => p.isPublished),
    [products]
  );

  const [filterProductId, setFilterProductId] = useState<string>('all');
  const [productId, setProductId] = useState<string>(
    publishedProducts[0]?.id ?? ''
  );
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(5);
  const [verifiedOrderCode, setVerifiedOrderCode] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return '5.0';
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (filterProductId === 'all') return reviews;
    return reviews.filter((r) => r.productId === filterProductId);
  }, [reviews, filterProductId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmittedNotice(null);

    const payload: ReviewFormInput = {
      productId,
      authorName,
      rating,
      verifiedOrderCode: verifiedOrderCode.trim() || undefined,
      comment,
    };

    const validationError = validateReviewInput(payload);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmitReview(payload);
      setAuthorName('');
      setVerifiedOrderCode('');
      setComment('');
      setRating(5);
      setSubmittedNotice('Thank you! Your verified review is now live.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to post review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 py-8 pb-20">
      {/* Header & Aggregate Rating Proof */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--elv-border)] pb-6">
        <div>
          <p className="text-xs font-medium text-[var(--elv-text-gold)]">
            {businessName} · Verified Doorstep Buyer Feedback
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[var(--elv-text-strong)]">
            Customer Reviews &amp; Arrival Ratings
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[var(--elv-text-muted)]">
            Real feedback from verified buyers on custom OEM build quality, combo value, and exact
            courier arrival precision.
          </p>
        </div>

        <div className="elv-panel flex items-center gap-5 rounded-xl px-5 py-3.5 shrink-0">
          <div>
            <p className="text-xs text-[var(--elv-text-muted)]">Storefront Rating</p>
            <p className="mt-0.5 flex items-center gap-1.5 font-mono text-2xl font-bold text-[var(--elv-text-gold)] tabular-nums">
              <span>{averageRating}</span>
              <span className="text-sm text-[var(--elv-text-muted)]">/ 5.0</span>
            </p>
          </div>
          <div className="h-9 w-px bg-[var(--elv-border)]" aria-hidden="true" />
          <div>
            <p className="text-xs text-[var(--elv-text-muted)]">Published Reviews</p>
            <p className="mt-0.5 font-mono text-xl font-bold text-[var(--elv-text-strong)] tabular-nums">
              {reviews.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Verified Reviews Feed */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label
              htmlFor="reviews-product-filter"
              className="text-xs font-medium text-[var(--elv-text-muted)]"
            >
              Filter by Electronics or Combo Model
            </label>
            <select
              id="reviews-product-filter"
              value={filterProductId}
              onChange={(e) => setFilterProductId(e.target.value)}
              className="elv-input min-h-[42px] rounded-lg px-3.5 text-xs sm:w-72"
            >
              <option value="all">All Electronics &amp; Combos ({reviews.length})</option>
              {publishedProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="elv-card rounded-2xl p-10 text-center space-y-2">
              <p className="font-display text-lg font-semibold text-[var(--elv-text-strong)]">
                No reviews for this model yet
              </p>
              <p className="text-xs text-[var(--elv-text-muted)]">
                Be the first buyer to rate this hardware using the form on the right.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {filteredReviews.map((rev) => {
                const matchedProduct = products.find((p) => p.id === rev.productId);
                return (
                  <li
                    key={rev.id}
                    className="elv-card rounded-2xl p-6 space-y-3 transition-colors hover:border-[var(--elv-border-strong)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-[var(--elv-text-strong)]">
                          {rev.authorName}
                        </span>
                        <span aria-hidden="true" className="text-[var(--elv-text-muted)]">
                          ·
                        </span>
                        <span className="inline-flex items-center gap-0.5 font-mono text-[var(--elv-text-gold)] tabular-nums">
                          {[1, 2, 3, 4, 5].map((idx) => (
                            <Star
                              key={idx}
                              className={`h-3 w-3 ${
                                idx <= rev.rating
                                  ? 'fill-current text-[var(--elv-text-gold)]'
                                  : 'text-[var(--elv-border-strong)]'
                              }`}
                              aria-hidden="true"
                            />
                          ))}
                          <span className="ml-1">({rev.rating}.0)</span>
                        </span>
                        {rev.verifiedOrderCode && (
                          <>
                            <span aria-hidden="true" className="text-[var(--elv-text-muted)]">
                              ·
                            </span>
                            <span className="font-mono text-[var(--elv-text-muted)]">
                              Order {rev.verifiedOrderCode}
                            </span>
                          </>
                        )}
                      </div>

                      <time className="font-mono text-[11px] text-[var(--elv-text-muted)] tabular-nums">
                        {new Date(rev.createdAtIso).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    </div>

                    <p className="font-display text-sm font-semibold text-[var(--elv-text-gold)]">
                      {rev.productTitle}
                    </p>

                    <p className="text-sm leading-relaxed text-[var(--elv-text-body)]">
                      {rev.comment}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--elv-border)] pt-3 text-xs text-[var(--elv-text-muted)]">
                      <span>{rev.arrivalFeedback ?? 'Verified Elvora Doorstep Delivery'}</span>
                      {matchedProduct && matchedProduct.stockRemaining > 0 && (
                        <button
                          type="button"
                          onClick={() => onAddToCart(matchedProduct, 1, true)}
                          className="font-semibold text-[var(--elv-text-gold)] underline underline-offset-4 hover:text-[var(--elv-text-strong)] whitespace-nowrap"
                        >
                          Shop Reviewed Item (${matchedProduct.price})
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right 5 Columns: Submit a Buyer Review Form */}
        <section
          aria-labelledby="write-review-heading"
          className="lg:col-span-5 elv-card rounded-2xl p-6 sm:p-7 space-y-5"
        >
          <div className="flex items-center gap-2.5">
            <MessageSquarePlus
              className="h-5 w-5 text-[var(--elv-text-gold)]"
              aria-hidden="true"
            />
            <h2
              id="write-review-heading"
              className="font-display text-lg font-bold text-[var(--elv-text-strong)]"
            >
              Write a Buyer Review
            </h2>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="review-product-select"
                className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
              >
                Electronics or Combo Purchased
              </label>
              <select
                id="review-product-select"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
              >
                {publishedProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (${p.price})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5">
                Star Rating
              </span>
              <div className="flex items-center gap-2" role="group" aria-label="Select star rating">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const active = starValue <= rating;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setRating(starValue)}
                      aria-label={`Rate ${starValue} out of 5 stars`}
                      aria-pressed={rating === starValue}
                      className={`flex min-h-[42px] min-w-[46px] items-center justify-center gap-1 rounded-lg border text-xs font-mono font-semibold transition-colors ${
                        active
                          ? 'border-[var(--elv-text-gold)] bg-[var(--elv-surface-alt)] text-[var(--elv-text-gold)]'
                          : 'border-[var(--elv-border)] text-[var(--elv-text-muted)]'
                      }`}
                    >
                      <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                      <span>{starValue}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="review-author-name"
                className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
              >
                Your Full Name
              </label>
              <input
                id="review-author-name"
                type="text"
                value={authorName}
                onChange={(e) => {
                  setAuthorName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. Amina Otieno"
                className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="review-order-code"
                className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
              >
                Elvora Order Code (Optional, e.g. ELV-8492)
              </label>
              <input
                id="review-order-code"
                type="text"
                value={verifiedOrderCode}
                onChange={(e) => setVerifiedOrderCode(e.target.value)}
                placeholder="ELV-8492"
                className="elv-input min-h-[44px] w-full rounded-lg px-3.5 font-mono text-sm uppercase"
              />
            </div>

            <div>
              <label
                htmlFor="review-comment"
                className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
              >
                Your Review (Hardware Finish, Sound/Performance &amp; Arrival Time)
              </label>
              <textarea
                id="review-comment"
                rows={4}
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Share how the hardware performs and whether your courier arrived on time..."
                className="elv-input w-full rounded-lg p-3.5 text-sm"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-[var(--elv-text-gold)]">
                {error}
              </p>
            )}

            {submittedNotice && (
              <p
                role="status"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--elv-text-gold)]"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>{submittedNotice}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="elv-btn-gold flex min-h-[46px] w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {submitting ? 'Publishing Review...' : 'Post Verified Review'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
