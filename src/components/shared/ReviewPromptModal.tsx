import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Copy, ExternalLink, PenLine, Star, X } from "lucide-react";
import { Button } from "./Button";
import { PlatformIcon } from "./PlatformIcon";
import { copyTextToClipboard } from "@/components/utils/reviewPlatform";
import type { ReviewPlatformMeta } from "@/components/utils/reviewPlatform";

const NOTE_MAX_LENGTH = 280;
const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Props = {
    open: boolean;
    onClose: () => void;
    platform: ReviewPlatformMeta;
    /** Flexologist / team member name. Pass null when unknown so we don't ask clients to mention "Employee". */
    employeeName: string | null;
    locationName?: string;
    /** Optional admin-configured message for the link. */
    message?: string;
    hasOpenedLink: boolean;
    onOpenReview: (note: string) => void;
};

const buildDefaultNote = (employeeName: string | null, locationName?: string) => {
    if (!employeeName) {
        return locationName ? `Had a great session at ${locationName}! ` : "Had a great session! ";
    }
    return locationName
        ? `Had a great session with ${employeeName} at ${locationName}! `
        : `Had a great session with ${employeeName}! `;
};

export const ReviewPromptModal = ({
    open,
    onClose,
    platform,
    employeeName,
    locationName,
    message,
    hasOpenedLink,
    onOpenReview,
}: Props) => {
    const titleId = useId();
    const descriptionId = useId();
    const noteId = useId();
    const prefersReducedMotion = useReducedMotion();

    const panelRef = useRef<HTMLDivElement>(null);
    const primaryRef = useRef<HTMLButtonElement>(null);
    const onCloseRef = useRef(onClose);
    const copiedTimerRef = useRef<number | undefined>(undefined);

    const [note, setNote] = useState(() => buildDefaultNote(employeeName, locationName));
    const [noteCopied, setNoteCopied] = useState(false);

    const isGoogle = platform.key === "google";
    const isYelp = platform.key === "yelp";

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => () => window.clearTimeout(copiedTimerRef.current), []);

    // Scroll lock, initial focus, Escape-to-close, focus trap and focus restore.
    useEffect(() => {
        if (!open) return;

        const previouslyFocused = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const frame = window.requestAnimationFrame(() => primaryRef.current?.focus());

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onCloseRef.current();
                return;
            }
            if (event.key !== "Tab" || !panelRef.current) return;

            const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            window.cancelAnimationFrame(frame);
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
            previouslyFocused?.focus?.();
        };
    }, [open]);

    // Move focus to the new primary action when switching to the "opened" state.
    useEffect(() => {
        if (open && hasOpenedLink) primaryRef.current?.focus();
    }, [open, hasOpenedLink]);

    const handleCopyNote = async () => {
        const copied = await copyTextToClipboard(note.trim());
        if (!copied) return;
        setNoteCopied(true);
        window.clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = window.setTimeout(() => setNoteCopied(false), 2000);
    };

    const headline = employeeName
        ? `So glad you enjoyed your session with ${employeeName}!`
        : "So glad you enjoyed your session!";

    const supportingCopy =
        message?.trim() ||
        (isYelp
            ? `Find us on Yelp and share your experience.${employeeName ? ` Mentioning ${employeeName} by name helps them get recognized.` : ""}`
            : `Would you take 30 seconds to share it on ${platform.label}?${employeeName ? ` Mentioning ${employeeName} by name helps them get recognized.` : ""}`);

    const steps = [
        {
            icon: Star,
            text: isGoogle ? "Tap the stars to rate us" : isYelp ? "Find our studio on Yelp" : `Rate us on ${platform.label}`,
        },
        {
            icon: PenLine,
            text: employeeName ? `Paste your note & mention ${employeeName}` : "Paste your note & share your experience",
        },
    ];

    const transition = prefersReducedMotion
        ? { duration: 0 }
        : { type: "spring" as const, damping: 30, stiffness: 320 };

    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        aria-hidden="true"
                        className="absolute inset-0 bg-dark-1/50 backdrop-blur-[2px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                        onClick={onClose}
                    />

                    {/* Panel: bottom sheet on mobile, centered card on larger screens */}
                    <motion.div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        aria-describedby={descriptionId}
                        className="relative w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-dark-1/20 px-4 sm:px-6 pt-3 sm:pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-7"
                        initial={prefersReducedMotion ? { opacity: 0 } : { y: 48, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { y: 48, opacity: 0 }}
                        transition={transition}
                    >
                        {/* Mobile grab handle */}
                        <div aria-hidden="true" className="sm:hidden mx-auto mb-3 h-1.5 w-10 rounded-full bg-grey-1" />

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-grey-2 hover:bg-neutral-base hover:text-dark-1 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-base/40"
                        >
                            <X size={16} className="sm:hidden" />
                            <X size={18} className="hidden sm:block" />
                        </button>

                        {hasOpenedLink ? (
                            <div className="text-center pt-1 sm:pt-2">
                                <div className="mx-auto mb-3.5 sm:mb-5 flex h-13 w-13 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                                    <Check size={24} strokeWidth={3} className="sm:hidden" />
                                    <Check size={30} strokeWidth={3} className="hidden sm:block" />
                                </div>
                                <h2 id={titleId} className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 tracking-tight text-balance">
                                    Almost done, thank you!
                                </h2>
                                <p id={descriptionId} className="mt-1.5 sm:mt-2 text-xs sm:text-sm md:text-base font-medium text-gray-500 leading-relaxed">
                                    Finish your review in the {platform.label} tab.
                                    {employeeName ? ` Don't forget to mention ${employeeName}.` : ""}
                                </p>

                                <div className="mt-5 sm:mt-7 space-y-2.5 sm:space-y-3">
                                    <Button
                                        ref={primaryRef}
                                        type="button"
                                        onClick={onClose}
                                        className="w-full py-3.5 sm:py-4 rounded-xl bg-primary-base text-white font-black uppercase tracking-[0.12em] sm:tracking-[0.15em] text-[11px] sm:text-xs shadow-xl shadow-primary-base/30 hover:bg-primary-base/90 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-base/30"
                                    >
                                        Done
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => onOpenReview(note)}
                                        className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-primary-base hover:underline cursor-pointer focus:outline-none focus-visible:underline"
                                    >
                                        Open {platform.label} again
                                        <ExternalLink size={12} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {/* Header */}
                                <div className="flex flex-col items-center text-center pt-1 sm:pt-2">
                                    <div className="relative mb-3 sm:mb-4">
                                        <div className="flex h-13 w-13 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary-secondary/60 border-2 sm:border-4 border-white shadow-inner text-primary-base font-black text-lg sm:text-2xl">
                                            {employeeName ? employeeName.charAt(0).toUpperCase() : <Star size={20} className="fill-primary-base sm:hidden" />}
                                            {employeeName ? null : <Star size={26} className="fill-primary-base hidden sm:block" />}
                                        </div>
                                        <PlatformIcon meta={platform} size={12} className="absolute -bottom-1 -right-1 rounded-full! ring-2 ring-white sm:hidden" />
                                        <PlatformIcon meta={platform} size={14} className="absolute -bottom-1 -right-1 rounded-full! ring-2 ring-white hidden sm:inline-flex" />
                                    </div>

                                    <div aria-hidden="true" className="mb-2 sm:mb-3 flex gap-0.5 sm:gap-1 text-amber-400">
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <Star key={index} size={15} className="fill-amber-400 sm:hidden" />
                                        ))}
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <Star key={index} size={18} className="fill-amber-400 hidden sm:block" />
                                        ))}
                                    </div>

                                    <h2 id={titleId} className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 tracking-tight text-balance">
                                        {headline}
                                    </h2>
                                    <p id={descriptionId} className="mt-1.5 sm:mt-2 text-xs sm:text-sm md:text-base font-medium text-gray-500 leading-relaxed">
                                        {supportingCopy}
                                    </p>
                                </div>

                                {/* Steps */}
                                <ol className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-2.5">
                                    {steps.map(({ icon: Icon, text }, index) => (
                                        <li
                                            key={text}
                                            className="flex items-start gap-2 sm:gap-2.5 rounded-xl border border-primary-secondary bg-primary-light p-2.5 sm:p-3 text-left"
                                        >
                                            <span className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-primary-base text-[10px] sm:text-[11px] font-black text-white">
                                                {index + 1}
                                            </span>
                                            <span className="text-[11px] sm:text-xs font-semibold text-grey-4 leading-snug">
                                                <Icon size={11} className="inline -mt-0.5 mr-1 text-primary-base" />
                                                {text}
                                            </span>
                                        </li>
                                    ))}
                                </ol>

                                {/* Editable shout-out note */}
                                <div className="mt-4 sm:mt-5 space-y-1.5 sm:space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor={noteId} className="text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest text-grey-2">
                                            Your shout-out <span className="normal-case tracking-normal font-medium">(optional)</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleCopyNote}
                                            disabled={!note.trim()}
                                            className="inline-flex items-center gap-1 rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-primary-base hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-base/40"
                                        >
                                            {noteCopied ? <Check size={12} /> : <Copy size={12} />}
                                            {noteCopied ? "Copied" : "Copy"}
                                        </button>
                                    </div>
                                    <textarea
                                        id={noteId}
                                        value={note}
                                        onChange={(event) => setNote(event.target.value.slice(0, NOTE_MAX_LENGTH))}
                                        maxLength={NOTE_MAX_LENGTH}
                                        rows={2}
                                        className="w-full resize-none rounded-xl border border-gray-200 bg-white p-2.5 sm:p-3.5 text-xs sm:text-sm text-gray-700 placeholder-gray-400 shadow-xs transition-all duration-300 focus:border-primary-base focus:outline-none focus:ring-2 focus:ring-primary-base/20"
                                    />
                                    <p className="text-[10px] sm:text-[11px] font-medium text-grey-2">
                                        We'll copy this for you. Just paste it into your review.
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="mt-4 sm:mt-6 space-y-1.5 sm:space-y-2">
                                    <Button
                                        ref={primaryRef}
                                        type="button"
                                        onClick={() => onOpenReview(note)}
                                        className="w-full py-3.5 sm:py-4 rounded-xl bg-primary-base text-white font-black uppercase tracking-[0.12em] sm:tracking-[0.15em] text-[11px] sm:text-xs flex items-center justify-center gap-2.5 sm:gap-3 shadow-xl shadow-primary-base/30 hover:bg-primary-base/90 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-base/30"
                                    >
                                        <PlatformIcon meta={platform} size={15} />
                                        <span>{platform.ctaLabel}</span>
                                        <ExternalLink size={13} className="text-white/70" />
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="w-full py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-grey-5 hover:text-dark-1 cursor-pointer transition-colors focus:outline-none focus-visible:underline"
                                    >
                                        Maybe later
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

