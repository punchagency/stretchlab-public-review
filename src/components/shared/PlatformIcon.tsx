import { Star } from "lucide-react";
import { SvgIcon } from "./SvgIcon";
import type { ReviewPlatformMeta } from "@/components/utils/reviewPlatform";

type Props = {
    meta: ReviewPlatformMeta;
    size?: number;
    className?: string;
};

/** Brand badge for an external review platform (Google, Yelp, Facebook or generic). */
export const PlatformIcon = ({ meta, size = 18, className = "" }: Props) => (
    <span
        aria-hidden="true"
        className={`inline-flex items-center justify-center rounded-lg shadow-xs shrink-0 ${meta.icon ? "bg-white" : "bg-primary-light"
            } ${className}`}
        style={{ padding: Math.round(size / 3) }}
    >
        {meta.icon ? (
            <SvgIcon name={meta.icon} width={size} height={size} />
        ) : (
            <Star size={size} className="text-primary-base fill-primary-base" />
        )}
    </span>
);

