export type NamePlacement = "start" | "middle" | "end";
export type StudioBrand = "stretchlab" | "rowhouse" | "generic";

export type HighlightId =
    | "attentive"
    | "knowledgeable"
    | "friendly"
    | "great_energy"
    | "clean_studio"
    | "feeling_looser"
    | "great_workout"
    | "feeling_refreshed";

export interface HighlightChip {
    id: HighlightId;
    label: string;
}

const MAX_NOTE_LENGTH = 280;

/**
 * Normalize all-lowercase or all-uppercase staff names (e.g. "antonio" -> "Antonio",
 * "KAYLA" -> "Kayla") while preserving intentional mixed casing like "McKenzie".
 */
export const formatEmployeeName = (employeeName: string | null | undefined): string | null => {
    const trimmed = employeeName?.trim();
    if (!trimmed) return null;

    return trimmed
        .split(/\s+/)
        .map((part) => {
            const isAllLower = part === part.toLowerCase();
            const isAllUpper = part === part.toUpperCase();
            if (isAllLower || isAllUpper) {
                return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
            }
            return part;
        })
        .join(" ");
};

export const detectStudioBrand = (locationName?: string): StudioBrand => {
    const raw = locationName?.trim() || "";
    if (/stretch\s*lab/i.test(raw)) return "stretchlab";
    if (/row\s*house/i.test(raw)) return "rowhouse";
    return "generic";
};

export const getHighlightChips = (locationName?: string): HighlightChip[] => {
    const brand = detectStudioBrand(locationName);
    const outcomeChip: HighlightChip =
        brand === "stretchlab"
            ? { id: "feeling_looser", label: "Feeling looser" }
            : brand === "rowhouse"
              ? { id: "great_workout", label: "Great workout" }
              : { id: "feeling_refreshed", label: "Feeling refreshed" };

    return [
        { id: "attentive", label: "Attentive" },
        { id: "knowledgeable", label: "Knowledgeable" },
        { id: "friendly", label: "Friendly" },
        { id: "great_energy", label: "Great energy" },
        outcomeChip,
        { id: "clean_studio", label: "Clean studio" },
    ];
};

/** Fast deterministic non-negative 32-bit FNV-1a hash. */
const hashSeed = (value: string): number => {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};

/** Deterministic seeded PRNG (Mulberry32) so every booking gets a reproducible unique mix. */
const createRng = (seedInt: number) => {
    let a = seedInt >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const pick = <T,>(items: readonly T[], rng: () => number): T =>
    items[Math.floor(rng() * items.length)];

const withArticle = (word: string): string =>
    `${/^[aeiou]/i.test(word) ? "an" : "a"} ${word}`;

// --- Compositional phrase pools ---

const ADJECTIVES = [
    "awesome",
    "fantastic",
    "amazing",
    "wonderful",
    "great",
    "top-notch",
    "excellent",
] as const;

const SESSION_NOUNS: Record<StudioBrand, readonly string[]> = {
    stretchlab: ["session", "stretch session", "visit", "appointment"],
    rowhouse: ["class", "session", "workout", "visit"],
    generic: ["session", "visit", "appointment", "experience"],
};

const GENERAL_CLOSERS = [
    "Already looking forward to coming back!",
    "Definitely coming back soon.",
    "Left feeling so much better.",
    "Highly recommend!",
    "Can't wait for my next visit.",
    "Really appreciated the care today.",
    "Five stars all around!",
    "",
] as const;

const STUDIO_PRAISE = [
    "Welcoming atmosphere and a great vibe",
    "Always such a positive experience",
    "Super welcoming team from the moment I walked in",
    "Really enjoyed the whole experience",
    "Everything ran smoothly from start to finish",
] as const;

// Natural phrasing per highlight chip so combinations read like a real customer wrote them.
const TRAIT_PHRASES: Record<HighlightId, readonly string[]> = {
    attentive: ["really attentive", "super attentive", "so attentive to what I needed"],
    knowledgeable: ["very knowledgeable", "super knowledgeable", "clearly experienced and knowledgeable"],
    friendly: ["genuinely friendly", "so friendly and welcoming", "warm and easy to talk to"],
    great_energy: ["brought such great energy", "had awesome energy the whole time", "kept the energy upbeat"],
    clean_studio: ["the studio was spotless", "the space was clean and welcoming", "the studio looked super clean"],
    feeling_looser: ["I walked out feeling so much looser", "I left feeling noticeably more flexible", "my body feels so much lighter now"],
    great_workout: ["I got an incredible workout in", "I left feeling strong and energized", "it was such a motivating workout"],
    feeling_refreshed: ["I walked out feeling completely refreshed", "I left feeling recharged and taken care of", "I feel so much better afterward"],
};

const PERSON_TRAIT_IDS = new Set<HighlightId>(["attentive", "knowledgeable", "friendly"]);

const formatHighlightClause = (
    highlights: HighlightId[],
    name: string | null,
    rng: () => number
): string => {
    if (highlights.length === 0) return "";

    const personTraits = highlights.filter((h) => PERSON_TRAIT_IDS.has(h));
    const otherHighlights = highlights.filter((h) => !PERSON_TRAIT_IDS.has(h));

    const fragments: string[] = [];

    if (personTraits.length > 0) {
        const words = personTraits.map((id) => pick(TRAIT_PHRASES[id], rng));
        const joined =
            words.length === 1
                ? words[0]
                : words.length === 2
                  ? `${words[0]} and ${words[1]}`
                  : `${words[0]}, ${words[1]}, and ${words[2]}`;
        fragments.push(name ? `${name} was ${joined}` : `the team was ${joined}`);
    }

    for (const id of otherHighlights) {
        const phrase = pick(TRAIT_PHRASES[id], rng);
        if (id === "great_energy") {
            fragments.push(name ? `${name} ${phrase}` : `everyone ${phrase}`);
        } else {
            fragments.push(phrase);
        }
    }

    if (fragments.length === 1) {
        const s = fragments[0];
        return s.charAt(0).toUpperCase() + s.slice(1) + ".";
    }

    const first = fragments[0].charAt(0).toUpperCase() + fragments[0].slice(1);
    if (fragments.length === 2) {
        return `${first}, and ${fragments[1]}.`;
    }
    return `${first}. Also, ${fragments[1]} and ${fragments[2]}.`;
};

const buildNamedSentence = ({
    name,
    location,
    brand,
    placement,
    highlights,
    rng,
}: {
    name: string;
    location?: string;
    brand: StudioBrand;
    placement: NamePlacement;
    highlights: HighlightId[];
    rng: () => number;
}): string => {
    const adj = pick(ADJECTIVES, rng);
    const noun = pick(SESSION_NOUNS[brand], rng);
    const closer = pick(GENERAL_CLOSERS, rng);
    const studioLine = pick(STUDIO_PRAISE, rng);
    // Include studio name ~65% of the time when available so reviews vary naturally.
    const useLoc = Boolean(location) && rng() < 0.65;
    const atLoc = useLoc && location ? ` at ${location}` : "";
    const toLoc = useLoc && location ? ` to ${location}` : "";

    // When highlights are chosen, craft a personalized sentence around them while
    // strictly honoring the requested name placement (start / middle / end).
    if (highlights.length > 0) {
        const hasPersonOrEnergy = highlights.some(
            (h) => PERSON_TRAIT_IDS.has(h) || h === "great_energy"
        );
        const detailWithSubject = formatHighlightClause(
            highlights,
            placement === "start" && hasPersonOrEnergy ? name : null,
            rng
        );

        if (placement === "start") {
            const detail = formatHighlightClause(highlights, null, rng);
            const leadOptions = hasPersonOrEnergy
                ? [
                      `${detailWithSubject} Made my ${noun}${atLoc} ${adj}!`,
                      `${name} made my ${noun}${atLoc} ${adj}. ${detail}`,
                      `${name}${atLoc} delivered a 5-star ${noun}! ${detail}`,
                  ]
                : [
                      `${name} made my ${noun}${atLoc} ${adj}! ${detailWithSubject}`,
                      `${name}${atLoc} did ${withArticle(adj)} job today. ${detailWithSubject}`,
                      `${name} took great care of me${atLoc}. ${detailWithSubject}`,
                  ];
            return `${pick(leadOptions, rng)} `;
        }

        if (placement === "middle") {
            const detail = formatHighlightClause(highlights, null, rng);
            const midOptions = [
                `Really enjoyed my ${noun} with ${name}${atLoc} today. ${detail}`,
                `Had such ${withArticle(adj)} ${noun} with ${name}${atLoc}. ${detail}`,
                `My ${noun} with ${name}${atLoc} was ${adj}! ${detail}`,
                `Always love working with ${name}${atLoc}. ${detail}`,
            ];
            return `${pick(midOptions, rng)} `;
        }

        // placement === "end"
        const detail = formatHighlightClause(highlights, null, rng);
        const endOptions = [
            `${detail} Huge thanks to ${name}${atLoc}!`,
            `${adj.charAt(0).toUpperCase()}${adj.slice(1)} ${noun}${atLoc}! ${detail} Ask for ${name}!`,
            `Five stars${useLoc && location ? ` for ${location}` : ""} today. ${detail} Big shoutout to ${name}!`,
            `Loved my visit${toLoc}. ${detail} Couldn't recommend ${name} more!`,
        ];
        return `${pick(endOptions, rng)} `;
    }

    // No highlights selected — compositional variety across start / middle / end.
    if (placement === "start") {
        const templates = [
            `${name} made my ${noun}${atLoc} ${adj}!${closer ? ` ${closer}` : ""}`,
            `${name}${atLoc} was ${adj} today and really listened to what I needed.${closer ? ` ${closer}` : ""}`,
            `${name} did ${withArticle(adj)} job during my ${noun}${atLoc} today.${closer ? ` ${closer}` : ""}`,
            `${name} always brings great energy${atLoc} and makes every ${noun} count!`,
            `${name} took such great care of me${atLoc} today! Truly a 5-star ${noun}.`,
            `${name} is the best! Always have ${withArticle(adj)} ${noun}${atLoc}.`,
        ];
        return `${pick(templates, rng)} `;
    }

    if (placement === "middle") {
        const templates = [
            `Really enjoyed my ${noun} with ${name}${atLoc} today!${closer ? ` ${closer}` : ""}`,
            `My ${noun} with ${name}${atLoc} was ${adj} from start to finish.${closer ? ` ${closer}` : ""}`,
            `Always ${withArticle(adj)} time working with ${name}${useLoc && location ? ` whenever I visit ${location}` : ""}.`,
            `I had such ${withArticle(adj)} ${noun} with ${name}${atLoc}, super attentive and thorough!`,
            `Highly recommend booking ${withArticle(noun)} with ${name}${useLoc && location ? ` at ${location}` : ""}!`,
            `Every ${noun} I've had with ${name}${atLoc} has been ${adj}.${closer ? ` ${closer}` : ""}`,
        ];
        return `${pick(templates, rng)} `;
    }

    // placement === "end"
    const templates = [
        `${studioLine}${atLoc}. Big thanks to ${name}!`,
        `${adj.charAt(0).toUpperCase()}${adj.slice(1)} ${noun}${atLoc} today. Huge shoutout to ${name}!`,
        `Left feeling refreshed and well taken care of${atLoc}, ask for ${name}!`,
        `Five stars${useLoc && location ? ` for ${location}` : ""} today. Really appreciated the ${adj} work from ${name}!`,
        `Loved my visit${toLoc} today! Couldn't recommend ${name} more.`,
        `Consistent, attentive, and always ${withArticle(adj)} ${noun}${atLoc}. Thank you, ${name}!`,
    ];
    return `${pick(templates, rng)} `;
};

const buildUnnamedSentence = ({
    location,
    brand,
    highlights,
    rng,
}: {
    location?: string;
    brand: StudioBrand;
    highlights: HighlightId[];
    rng: () => number;
}): string => {
    const adj = pick(ADJECTIVES, rng);
    const noun = pick(SESSION_NOUNS[brand], rng);
    const atLoc = location ? ` at ${location}` : "";
    const detail = formatHighlightClause(highlights, null, rng);

    if (detail) {
        const templates = [
            `Had ${withArticle(adj)} ${noun}${atLoc} today! ${detail}`,
            `${detail} Really enjoyed my ${noun}${atLoc}!`,
            `Five stars${location ? ` for ${location}` : ""}! ${detail}`,
        ];
        return `${pick(templates, rng)} `;
    }

    const templates = [
        `Had ${withArticle(adj)} ${noun}${atLoc} today!`,
        `${pick(STUDIO_PRAISE, rng)}${atLoc}.`,
        `Always leave feeling great after my ${noun}${atLoc}!`,
        `Five stars${location ? ` for ${location}` : ""}, friendly team and ${withArticle(adj)} ${noun}!`,
        `Really enjoyed my visit${atLoc} today. Highly recommend!`,
    ];
    return `${pick(templates, rng)} `;
};

const PLACEMENTS: readonly NamePlacement[] = ["start", "middle", "end"];

export interface SuggestedReviewResult {
    text: string;
    variant: number;
    placement: NamePlacement;
}

/**
 * Compositional review draft generator:
 * - Always includes `employeeName` (cleanly capitalized) when available.
 * - Varies phrasing, sentence structure, location inclusion, and name placement
 *   (`start` / `middle` / `end`) across hundreds of natural combinations.
 * - Dynamically incorporates any quick-tap `highlights` chosen by the customer.
 * - Deterministic for a given `(seed, variant, highlights)`, and rotates across
 *   name-placement buckets as `variant` increments on shuffle.
 */
export const getSuggestedReviewNote = ({
    employeeName,
    locationName,
    seed,
    variant = 0,
    highlights = [],
}: {
    employeeName: string | null;
    locationName?: string;
    seed?: string;
    variant?: number;
    highlights?: HighlightId[];
}): SuggestedReviewResult => {
    const cleanName = formatEmployeeName(employeeName);
    const cleanLocation = locationName?.trim() || undefined;
    const brand = detectStudioBrand(cleanLocation);

    const baseHash = seed
        ? hashSeed(`${seed}:${cleanName ?? "anon"}`)
        : Math.floor(Math.random() * 1_000_000);

    // Rotate start -> middle -> end on each shuffle so consecutive ideas feel distinct.
    const placement = PLACEMENTS[(baseHash + variant) % PLACEMENTS.length];

    const variantHash = hashSeed(
        `${baseHash}:v${variant}:${highlights.join(",")}:${placement}`
    );
    const rng = createRng(variantHash);

    const rawText = cleanName
        ? buildNamedSentence({
              name: cleanName,
              location: cleanLocation,
              brand,
              placement,
              highlights,
              rng,
          })
        : buildUnnamedSentence({
              location: cleanLocation,
              brand,
              highlights,
              rng,
          });

    const text =
        rawText.length <= MAX_NOTE_LENGTH
            ? rawText
            : `${rawText.slice(0, MAX_NOTE_LENGTH - 1).trimEnd()} `;

    return { text, variant, placement };
};
