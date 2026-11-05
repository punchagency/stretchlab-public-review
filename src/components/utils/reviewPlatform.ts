import type { SvgIconName } from "@/types";

export type ReviewPlatformKey = "google" | "yelp" | "facebook" | "other";

export interface ReviewPlatformMeta {
    key: ReviewPlatformKey;
    /** Human readable platform name, e.g. "Google". */
    label: string;
    /** Brand icon from the shared SvgIcon set (undefined for unknown platforms). */
    icon?: SvgIconName;
    /** Primary call-to-action label. */
    ctaLabel: string;
    /** Short verb phrase used in sentences, e.g. "rate us on Google". */
    actionPhrase: string;
}

/**
 * Normalises the admin-configured platform string into display metadata.
 * Yelp intentionally uses softer "Find us on Yelp" wording, in line with
 * Yelp's guidance that businesses should not directly solicit reviews.
 */
export const getReviewPlatformMeta = (platform?: string | null): ReviewPlatformMeta => {
    const normalized = platform?.toLowerCase().trim() ?? "";

    if (normalized.includes("google")) {
        return {
            key: "google",
            label: "Google",
            icon: "google",
            ctaLabel: "Review us on Google",
            actionPhrase: "rate us on Google",
        };
    }

    if (normalized.includes("yelp")) {
        return {
            key: "yelp",
            label: "Yelp",
            icon: "yelp",
            ctaLabel: "Find us on Yelp",
            actionPhrase: "find us on Yelp",
        };
    }

    if (normalized.includes("facebook")) {
        return {
            key: "facebook",
            label: "Facebook",
            icon: "facebook",
            ctaLabel: "Review us on Facebook",
            actionPhrase: "review us on Facebook",
        };
    }

    const label = platform?.trim() || "our review page";
    return {
        key: "other",
        label,
        ctaLabel: platform?.trim() ? `Review us on ${label}` : "Leave a review",
        actionPhrase: platform?.trim() ? `review us on ${label}` : "leave us a review",
    };
};

/** Only allow http(s) links so admin-configured URLs can never execute script. */
export const isSafeExternalUrl = (url?: string | null): url is string => {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
        return false;
    }
};

const legacyCopy = (text: string): boolean => {
    try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.top = "0";
        textarea.style.left = "0";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, text.length);
        const copied = document.execCommand("copy");
        document.body.removeChild(textarea);
        return copied;
    } catch {
        return false;
    }
};

/**
 * Copies text to the clipboard using the async Clipboard API when available,
 * falling back to the legacy execCommand approach (older Safari / in-app browsers).
 * Must be invoked synchronously from a user gesture for the best success rate.
 */
export const copyTextToClipboard = (text: string): Promise<boolean> => {
    if (!text) return Promise.resolve(false);

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText && window.isSecureContext) {
        return navigator.clipboard
            .writeText(text)
            .then(() => true)
            .catch(() => legacyCopy(text));
    }

    return Promise.resolve(legacyCopy(text));
};

/**
 * Opens an external URL in a new tab. Must be called synchronously inside a
 * click handler so popup blockers allow it. If the popup is blocked (common in
 * SMS in-app browsers), falls back to navigating the current tab, since the
 * feedback has already been saved at this point.
 */
export const openExternalLink = (url: string): boolean => {
    if (!isSafeExternalUrl(url)) return false;

    const newWindow = window.open(url, "_blank");
    if (newWindow) {
        try {
            newWindow.opener = null;
        } catch {
            // Cross-origin assignment can throw in some browsers; safe to ignore.
        }
        return true;
    }

    window.location.assign(url);
    return true;
};

