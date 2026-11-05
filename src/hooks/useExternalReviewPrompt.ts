import { useCallback, useEffect, useRef, useState } from "react";
import {
    copyTextToClipboard,
    openExternalLink,
    renderErrorToast,
    renderSuccessToast,
} from "@/components/utils";
import type { ReviewLink } from "@/types/review";

export type ReviewPromptStatus = "idle" | "dismissed" | "opened";

const STORAGE_PREFIX = "stretchnote:review-prompt:";

const readStatus = (token?: string): ReviewPromptStatus => {
    if (!token) return "idle";
    try {
        const value = window.sessionStorage.getItem(`${STORAGE_PREFIX}${token}`);
        return value === "dismissed" || value === "opened" ? value : "idle";
    } catch {
        // sessionStorage can be unavailable (e.g. Safari private mode).
        return "idle";
    }
};

const writeStatus = (token: string | undefined, status: ReviewPromptStatus) => {
    if (!token) return;
    try {
        window.sessionStorage.setItem(`${STORAGE_PREFIX}${token}`, status);
    } catch {
        // Non-critical: the prompt simply may re-appear in this session.
    }
};

type Options = {
    token?: string;
    link?: ReviewLink | null;
    employeeName?: string | null;
};

/**
 * Owns the post-feedback external review prompt: when to show it, whether the
 * client already opened the review link this session, and the
 * copy-note-then-open-link action.
 */
export const useExternalReviewPrompt = ({ token, link, employeeName }: Options) => {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<ReviewPromptStatus>(() => readStatus(token));
    const timerRef = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(timerRef.current), []);

    const persist = useCallback(
        (next: ReviewPromptStatus) => {
            setStatus(next);
            writeStatus(token, next);
        },
        [token]
    );

    /** Show the prompt after a short delay so the thank-you state registers first. */
    const present = useCallback(
        (delayMs = 650) => {
            if (!link || readStatus(token) !== "idle") return;
            window.clearTimeout(timerRef.current);
            timerRef.current = window.setTimeout(() => setIsOpen(true), delayMs);
        },
        [link, token]
    );

    const dismiss = useCallback(() => {
        window.clearTimeout(timerRef.current);
        setIsOpen(false);
        if (readStatus(token) !== "opened" && status !== "opened") {
            persist("dismissed");
        }
    }, [persist, status, token]);

    /**
     * Copies the optional shout-out note and opens the review link.
     * Both steps run synchronously in the click handler so browsers treat
     * them as user-initiated (no popup blocking, clipboard permitted).
     */
    const openReview = useCallback(
        (note?: string) => {
            if (!link) return false;

            const trimmedNote = note?.trim() ?? "";
            const copyPromise = trimmedNote ? copyTextToClipboard(trimmedNote) : Promise.resolve(false);

            const opened = openExternalLink(link.link_url);
            if (!opened) {
                renderErrorToast("We couldn't open the review page. Please try again.");
                return false;
            }

            persist("opened");

            void copyPromise.then((copied) => {
                if (!copied) return;
                renderSuccessToast(
                    employeeName
                        ? `Note copied! Paste it in your review and mention ${employeeName}.`
                        : "Note copied! Paste it in your review."
                );
            });

            return true;
        },
        [employeeName, link, persist]
    );

    return {
        isOpen,
        status,
        hasOpenedLink: status === "opened",
        present,
        dismiss,
        openReview,
    };
};
