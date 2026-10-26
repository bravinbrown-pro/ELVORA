import { FormEvent, useState } from 'react';
import { Building2, Check, Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import {
  ELVORA_BRAND_MOTTO,
  InquiryFormInput,
  OwnerConfig,
  computeExactArrivalInfo,
  validateInquiryInput,
} from '../utils/commerce';
import { ElvoraBrandEmblem } from './ElvoraLogo';

interface ContactViewProps {
  ownerConfig: OwnerConfig;
  onSubmitInquiry: (input: InquiryFormInput) => Promise<void>;
}

export function ContactView({ ownerConfig, onSubmitInquiry }: ContactViewProps) {
  const [senderName, setSenderName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [topic, setTopic] = useState<InquiryFormInput['topic']>('delivery');
  const [orderCode, setOrderCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState<string | null>(null);

  const expressArrival = computeExactArrivalInfo('express_city');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSentConfirmation(null);

    const payload: InquiryFormInput = {
      senderName,
      contactInfo,
      topic,
      orderCode: orderCode.trim() || undefined,
      message,
    };

    const validationError = validateInquiryInput(payload);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmitInquiry(payload);
      setSenderName('');
      setContactInfo('');
      setOrderCode('');
      setMessage('');
      setSentConfirmation(
        `Inquiry delivered directly to ${ownerConfig.merchantName} (${ownerConfig.payoutPhone}). Our team responds promptly.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 py-8 pb-20">
      <div className="border-b border-[var(--elv-border)] pb-6">
        <p className="text-xs font-medium text-[var(--elv-text-gold)]">
          Official Merchant &amp; Customer Care Desk
        </p>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[var(--elv-text-strong)]">
          Contact {ownerConfig.merchantName}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-[var(--elv-text-muted)]">
          Need assistance with combo bundles, exact courier arrival scheduling, holiday promo
          codes, or prepaid settlement verification? Reach our local dispatch desk directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 5 Columns: Registered Business Identity & Direct Channels */}
        <div className="lg:col-span-5 space-y-6">
          <div className="elv-card rounded-2xl p-6 sm:p-7 space-y-6">
            <ElvoraBrandEmblem
              showMotto={true}
              businessName={ownerConfig.merchantName}
              size="lg"
            />

            <div className="space-y-4 border-t border-[var(--elv-border)] pt-5 text-sm">
              <div className="flex items-start gap-3">
                <Building2
                  className="mt-0.5 h-4 w-4 text-[var(--elv-text-gold)] shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs text-[var(--elv-text-muted)]">Registered Business Name</p>
                  <p className="font-semibold text-[var(--elv-text-strong)]">
                    {ownerConfig.merchantName}
                  </p>
                  <p className="text-xs text-[var(--elv-text-muted)]">{ELVORA_BRAND_MOTTO}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone
                  className="mt-0.5 h-4 w-4 text-[var(--elv-text-gold)] shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs text-[var(--elv-text-muted)]">
                    Direct Phone &amp; Prepaid Settlement Line
                  </p>
                  <p className="font-mono font-semibold text-[var(--elv-text-gold)]">
                    {ownerConfig.payoutPhone}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail
                  className="mt-0.5 h-4 w-4 text-[var(--elv-text-gold)] shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs text-[var(--elv-text-muted)]">Customer Support Email</p>
                  <p className="font-mono text-[var(--elv-text-strong)]">
                    {ownerConfig.supportEmail}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin
                  className="mt-0.5 h-4 w-4 text-[var(--elv-text-gold)] shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs text-[var(--elv-text-muted)]">
                    Local Electronics Vault &amp; Pickup Hub
                  </p>
                  <p className="text-[var(--elv-text-body)]">{ownerConfig.hubAddress}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock
                  className="mt-0.5 h-4 w-4 text-[var(--elv-text-gold)] shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs text-[var(--elv-text-muted)]">
                    Live Express Dispatch Schedule
                  </p>
                  <p className="text-[var(--elv-text-body)]">
                    Mon–Sun · 7:00 AM – 10:00 PM (Next express slot arrives{' '}
                    <strong className="text-[var(--elv-text-gold)]">
                      {expressArrival.exactTimeLabel}
                    </strong>
                    )
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 7 Columns: Direct Support Message Form routed to Owner Hub */}
        <section
          aria-labelledby="contact-form-heading"
          className="lg:col-span-7 elv-card rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <div>
            <h2
              id="contact-form-heading"
              className="font-display text-xl font-bold text-[var(--elv-text-strong)]"
            >
              Send a Direct Message to Our Team
            </h2>
            <p className="mt-1 text-xs text-[var(--elv-text-muted)]">
              Messages route immediately to the {ownerConfig.merchantName} mobile command desk.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="contact-sender-name"
                  className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                >
                  Your Full Name
                </label>
                <input
                  id="contact-sender-name"
                  type="text"
                  value={senderName}
                  onChange={(e) => {
                    setSenderName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. Samuel Kariuki"
                  className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-info"
                  className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                >
                  Phone Number or Email Address
                </label>
                <input
                  id="contact-info"
                  type="text"
                  value={contactInfo}
                  onChange={(e) => {
                    setContactInfo(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="+254 722 000 111 or email@domain.com"
                  className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="contact-topic"
                  className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                >
                  Inquiry Topic
                </label>
                <select
                  id="contact-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as InquiryFormInput['topic'])}
                  className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
                >
                  <option value="delivery">Exact Delivery Time &amp; Courier Fees</option>
                  <option value="combos">Combo Bundles &amp; Black Friday Discounts</option>
                  <option value="payment">Prepaid Payment Verification</option>
                  <option value="warranty">12-Month Hardware Warranty</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="contact-order-code"
                  className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                >
                  Order Code (Optional)
                </label>
                <input
                  id="contact-order-code"
                  type="text"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  placeholder="e.g. ELV-8492"
                  className="elv-input min-h-[44px] w-full rounded-lg px-3.5 font-mono text-sm uppercase"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
              >
                How Can We Help?
              </label>
              <textarea
                id="contact-message"
                rows={4}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ask about custom combos, bulk corporate orders, exact delivery times, or warranty service..."
                className="elv-input w-full rounded-lg p-3.5 text-sm"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-[var(--elv-text-gold)]">
                {error}
              </p>
            )}

            {sentConfirmation && (
              <p
                role="status"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--elv-text-gold)]"
              >
                <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{sentConfirmation}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="elv-btn-gold inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>{submitting ? 'Sending Message...' : 'Send Message to Elvora Support'}</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
