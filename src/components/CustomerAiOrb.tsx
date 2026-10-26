import {
  FormEvent,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { GripHorizontal, MessageCircleQuestion, Send, X } from 'lucide-react';
import {
  Point2D,
  clampOrbPosition,
  computeChatPanelBox,
  getDefaultOrbPosition,
  isPointerDrag,
} from '../utils/assistantPosition';
import { computeExactArrivalInfo } from '../utils/commerce';

export type SuggestedAssistantAction =
  | 'open_bag'
  | 'track_order'
  | 'browse_catalog'
  | 'open_reviews'
  | 'open_contact'
  | 'none';

export interface CustomerChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  suggestedAction?: SuggestedAssistantAction;
}

interface CustomerAiOrbProps {
  ownerPhone: string;
  businessName: string;
  onSuggestedAction: (
    action: Exclude<SuggestedAssistantAction, 'none'>
  ) => void;
}

const STORAGE_POS_KEY = 'elvora_customer_ai_orb_pos_v1';

const QUICK_TOPICS: { label: string; prompt: string }[] = [
  {
    label: 'Exact Arrival & Cost',
    prompt: 'What is the exact arrival time and delivery cost if I order right now?',
  },
  {
    label: 'Combos & Black Friday',
    prompt: 'What Earpods + Smartwatch combos and Black Friday discounts do you have?',
  },
  {
    label: 'Buyer Reviews',
    prompt: 'Where can I read or leave customer reviews?',
  },
  {
    label: 'Contact Us',
    prompt: 'How can I contact your business directly?',
  },
];

export function CustomerAiOrb({
  ownerPhone,
  businessName,
  onSuggestedAction,
}: CustomerAiOrbProps) {
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
  }));

  const [orbPos, setOrbPos] = useState<Point2D>(() => {
    const vp = {
      width: typeof window !== 'undefined' ? window.innerWidth : 1440,
      height: typeof window !== 'undefined' ? window.innerHeight : 900,
    };
    try {
      const saved = localStorage.getItem(STORAGE_POS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Point2D;
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return clampOrbPosition(parsed, vp);
        }
      }
    } catch {
      // Ignore storage read errors
    }
    return getDefaultOrbPosition(vp);
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<CustomerChatMessage[]>(() => {
    const expressEta = computeExactArrivalInfo('express_city');
    return [
      {
        id: 'welcome',
        role: 'assistant',
        text: `Welcome to ${businessName.replace(/\.$/, '')}. Order now for exact Express arrival ${expressEta.exactTimeLabel} (+$12 base local delivery, prepaid to ${ownerPhone}). Ask me about combos, Black Friday offers, exact delivery times, or drag this round gold button anywhere!`,
      },
    ];
  });

  const dragRef = useRef<{
    pointerId: number;
    startPointer: Point2D;
    startOrb: Point2D;
    moved: boolean;
  } | null>(null);

  const suppressNextClickRef = useRef(false);
  const orbButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const nextVp = { width: window.innerWidth, height: window.innerHeight };
      setViewport(nextVp);
      setOrbPos((prev) => clampOrbPosition(prev, nextVp));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useLayoutEffect(() => {
    if (orbButtonRef.current) {
      orbButtonRef.current.style.left = `${orbPos.x}px`;
      orbButtonRef.current.style.top = `${orbPos.y}px`;
    }
    if (panelRef.current && isOpen) {
      const box = computeChatPanelBox(orbPos, viewport);
      panelRef.current.style.left = `${box.left}px`;
      panelRef.current.style.top = `${box.top}px`;
      panelRef.current.style.width = `${box.width}px`;
      panelRef.current.style.maxHeight = `${box.maxHeight}px`;
    }
  }, [orbPos, viewport, isOpen]);

  useEffect(() => {
    if (isOpen && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, sending, isOpen]);

  const persistOrbPosition = (pos: Point2D) => {
    try {
      localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(pos));
    } catch {
      // Ignore storage write errors
    }
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startPointer: { x: e.clientX, y: e.clientY },
      startOrb: { ...orbPos },
      moved: false,
    };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const active = dragRef.current;
    if (!active || active.pointerId !== e.pointerId) return;

    const currentPointer = { x: e.clientX, y: e.clientY };
    if (!active.moved && isPointerDrag(active.startPointer, currentPointer)) {
      active.moved = true;
      setIsDragging(true);
    }

    if (active.moved) {
      const dx = currentPointer.x - active.startPointer.x;
      const dy = currentPointer.y - active.startPointer.y;
      const nextPos = clampOrbPosition(
        { x: active.startOrb.x + dx, y: active.startOrb.y + dy },
        { width: window.innerWidth, height: window.innerHeight }
      );
      setOrbPos(nextPos);
    }
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    const active = dragRef.current;
    if (!active || active.pointerId !== e.pointerId) return;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (active.moved) {
      suppressNextClickRef.current = true;
      persistOrbPosition(orbPos);
      setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 80);
    }

    dragRef.current = null;
    setIsDragging(false);
  };

  const handleOrbKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = 24;
    let delta: Point2D | null = null;
    if (e.key === 'ArrowLeft') delta = { x: -step, y: 0 };
    if (e.key === 'ArrowRight') delta = { x: step, y: 0 };
    if (e.key === 'ArrowUp') delta = { x: 0, y: -step };
    if (e.key === 'ArrowDown') delta = { x: 0, y: step };

    if (delta) {
      e.preventDefault();
      setOrbPos((prev) => {
        const next = clampOrbPosition(
          { x: prev.x + delta.x, y: prev.y + delta.y },
          viewport
        );
        persistOrbPosition(next);
        return next;
      });
    }
  };

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || sending) return;

    const userMsg: CustomerChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/ai/customer-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to reach Elvora Customer AI.');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: data.reply,
          suggestedAction: data.suggestedAction ?? 'none',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text:
            err instanceof Error
              ? err.message
              : 'Connection interrupted. Please try asking again.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendQuestion(input);
  };

  const actionButtonLabel = (action: Exclude<SuggestedAssistantAction, 'none'>) => {
    if (action === 'open_bag') return 'Open Bag & Checkout';
    if (action === 'track_order') return 'Go to Order Tracking';
    if (action === 'open_reviews') return 'View Customer Reviews';
    if (action === 'open_contact') return 'Open Contact Us';
    return 'Browse Electronics & Combos';
  };

  return (
    <>
      {isOpen && (
        <section
          ref={panelRef}
          aria-label="Elvora Customer Help Assistant"
          className="elv-card fixed z-40 flex flex-col overflow-hidden rounded-2xl border-[var(--elv-border-strong)] shadow-2xl"
        >
          {/* Draggable Chat Header */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="flex cursor-grab active:cursor-grabbing touch-none select-none items-center justify-between border-b border-[var(--elv-border)] bg-[var(--elv-surface-alt)] px-4 py-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <GripHorizontal
                className="h-4 w-4 text-[var(--elv-text-gold)] shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <h2 className="truncate font-display text-sm font-bold text-[var(--elv-text-strong)]">
                  Elvora Goldline Concierge
                </h2>
                <p className="truncate text-[11px] text-[var(--elv-text-muted)]">
                  Exact arrival clock times, combos &amp; support
                </p>
              </div>
            </div>

            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setIsOpen(false)}
              aria-label="Close Customer AI Assistant"
              className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-full text-[var(--elv-text-muted)] hover:text-[var(--elv-text-strong)]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Conversation Feed */}
          <div ref={feedRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'elv-btn-gold font-medium'
                      : 'elv-panel text-[var(--elv-text-body)]'
                  }`}
                >
                  {msg.text}
                </div>

                {msg.role === 'assistant' &&
                  msg.suggestedAction &&
                  msg.suggestedAction !== 'none' && (() => {
                    const action = msg.suggestedAction;
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          onSuggestedAction(action);
                          setIsOpen(false);
                        }}
                        className="elv-btn-outline mt-1.5 rounded-lg px-3 py-1 text-[11px] font-semibold whitespace-nowrap"
                      >
                        {actionButtonLabel(action)}
                      </button>
                    );
                  })()}
              </div>
            ))}

            {sending && (
              <p className="text-xs text-[var(--elv-text-gold)]">
                Calculating exact courier arrival &amp; live inventory...
              </p>
            )}
          </div>

          {/* 1-Tap Quick Topics */}
          <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--elv-border)] px-3 py-2">
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic.label}
                type="button"
                disabled={sending}
                onClick={() => void sendQuestion(topic.prompt)}
                className="elv-btn-outline rounded-lg px-2.5 py-1 text-[11px] font-medium whitespace-nowrap"
              >
                {topic.label}
              </button>
            ))}
          </div>

          {/* Message Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-[var(--elv-border)] bg-[var(--elv-surface)] p-3"
          >
            <label htmlFor="customer-ai-input" className="sr-only">
              Ask Elvora Customer AI a question
            </label>
            <input
              id="customer-ai-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask exact arrival time, delivery cost, combos..."
              className="elv-input min-h-[40px] flex-1 rounded-full px-3.5 text-xs"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send question to Customer AI"
              className="elv-btn-gold flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      {/* Round & Movable Floating Black & Gold Customer AI Button */}
      <button
        ref={orbButtonRef}
        type="button"
        data-always-dark="true"
        aria-label="Customer AI Help"
        aria-expanded={isOpen}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleOrbKeyDown}
        onClick={() => {
          if (suppressNextClickRef.current) return;
          setIsOpen((prev) => !prev);
        }}
        className={`fixed z-40 flex h-14 w-14 touch-none select-none flex-col items-center justify-center rounded-full border-2 border-[#ecc55c] bg-[#080705] text-[#ecc55c] shadow-xl ring-1 ring-black/30 transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ecc55c] ${
          isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab hover:scale-105'
        }`}
      >
        {isOpen ? (
          <X className="h-5 w-5 text-[#ecc55c]" aria-hidden="true" />
        ) : (
          <>
            <MessageCircleQuestion className="h-5 w-5 text-[#ecc55c]" aria-hidden="true" />
            <span className="mt-0.5 font-mono text-[9px] font-bold tracking-tight text-[#f7e2ab] leading-none">
              AI
            </span>
          </>
        )}
      </button>
    </>
  );
}

