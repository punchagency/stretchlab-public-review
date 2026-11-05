import { useState, useMemo } from "react";
import { useParams } from "react-router";
import { Button, Spinner, PlatformIcon, ReviewPromptModal } from "@/components/shared";
import { renderSuccessToast, renderErrorToast, getReviewPlatformMeta } from "@/components/utils";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { useLocationLandingPage, useSubmitReview, useSubmitNegativeReview } from "@/hooks/useReview";
import { useExternalReviewPrompt } from "@/hooks/useExternalReviewPrompt";
import { FullLoader } from "@/components/shared/FullLoader";
import type { ReviewLink } from "@/types/review";

const RATINGS = [
    { label: "Terrible", emoji: "😫", value: 1, color: "text-red-500" },
    { label: "Bad", emoji: "☹️ ", value: 2, color: "text-orange-500" },
    { label: "Okay", emoji: "😐", value: 3, color: "text-yellow-500" },
    { label: "Good", emoji: "🙂", value: 4, color: "text-lime-500" },
    { label: "Great", emoji: "🥰", value: 5, color: "text-emerald-500" },
];

export const PublicReview = () => {
    const { token } = useParams();
    const { data: landingPageData, isLoading } = useLocationLandingPage(token);
    const { mutateAsync: submitMutation } = useSubmitReview();
    const { mutateAsync: submitNegativeMutation } = useSubmitNegativeReview();

    const [rating, setRating] = useState<number | null>(null);
    const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
    const [reason, setReason] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const platformLinks = useMemo<ReviewLink[]>(() => {
        if (!landingPageData?.links) return [];
        try {
            const raw = typeof landingPageData.links === "string"
                ? JSON.parse(landingPageData.links)
                : landingPageData.links;
            if (Array.isArray(raw)) {
                return raw.filter((item): item is ReviewLink => !!item && !!item.link_url);
            }
            if (raw && typeof raw === "object" && raw.link_url) {
                return [raw as ReviewLink];
            }
            return [];
        } catch (e) {
            console.error("Failed to parse links:", e);
            return [];
        }
    }, [landingPageData]);

    const followUpOptions = useMemo<string[]>(() => {
        const raw = landingPageData?.data?.negative_follow_up_options;
        if (!raw) return [];
        try {
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error("Failed to parse negative_follow_up_options:", e);
            return [];
        }
    }, [landingPageData]);

    const threshold = typeof landingPageData?.data?.negative_review_threshold === "number"
        ? landingPageData.data.negative_review_threshold
        : 3;

    const isNegative = rating !== null && rating <= threshold;
    const canSubmit = rating !== null && (!isNegative || selectedIssues.length > 0 || reason.trim().length > 0);

    const employee = {
        name: landingPageData?.data?.employee_name || "Employee",
        location: landingPageData?.data?.location_name || "",
        avatar: landingPageData?.data?.employee_name ? landingPageData.data.employee_name.charAt(0) : "E",
        booking_id: landingPageData?.data?.booking_id,
        customer_name: landingPageData?.data?.customer_name,
    };

    const flexologistName = landingPageData?.data?.employee_name?.trim() || null;
    const primaryLink = platformLinks[0] || null;
    const primaryPlatformMeta = useMemo(
        () => getReviewPlatformMeta(primaryLink?.platform),
        [primaryLink?.platform]
    );

    const {
        isOpen: isPromptOpen,
        status: promptStatus,
        hasOpenedLink,
        present: presentPrompt,
        dismiss: dismissPrompt,
        openReview,
    } = useExternalReviewPrompt({
        token,
        link: primaryLink,
        employeeName: flexologistName,
    });

    const toggleIssue = (issue: string) => {
        setSelectedIssues(prev =>
            prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
        );
    };

    const handleSubmit = async () => {
        if (!rating || !token || !canSubmit) return;

        setIsSubmitting(true);
        try {
            if (isNegative) {
                await submitNegativeMutation({
                    booking_token: token,
                    feedback: selectedIssues,
                    reason: reason.trim(),
                    rating,
                });
            } else {
                await submitMutation({
                    booking_token: token,
                    feedback: rating,
                    feedback_type: "feedback",
                });
            }

            setSubmitted(true);
            renderSuccessToast("Thank you for your feedback!");

                // Only prompt positive raters with the external review modal
                if (primaryLink && !isNegative) {
                    presentPrompt(500);
                }
            } catch (error: unknown) {
                const err = error as { response?: { data?: { error?: string } } };
                renderErrorToast(err.response?.data?.error || "Failed to submit feedback. Please try again.");
            } finally {
                setIsSubmitting(false);
            }
        };

        if (isLoading) {
            return <FullLoader text="Loading review page..." />;
        }

        if (submitted) {
            return (
                <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-in fade-in duration-500">
                    <div className="max-w-md w-full">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5 text-emerald-500 animate-in zoom-in duration-700 delay-200">
                            <CheckCircle2 size={36} className="sm:hidden" />
                            <CheckCircle2 size={45} className="hidden sm:block" />
                        </div>
                        <h1 className="text-lg sm:text-xl md:text-3xl font-black text-gray-900 mb-2 sm:mb-3">Thank You!</h1>
                        <p className="text-gray-500 font-medium text-sm sm:text-base md:text-lg">
                            {isNegative
                                ? (landingPageData?.data?.negative_follow_up_message ||
                                    "Thank you for your feedback. We are sorry to hear about your experience. A team member will follow up shortly.")
                                : "Your feedback has been received."}
                        </p>

                        {/* 
                          Display review card at the bottom:
                          - Always visible for negative raters (since modal is suppressed)
                          - For positive raters: only shown if they dismissed the modal or already interacted with it
                        */}
                        {platformLinks.length > 0 && (isNegative || promptStatus === "dismissed" || hasOpenedLink) && (
                            <div className="mt-6 sm:mt-8 space-y-4 animate-in slide-in-from-bottom-4 duration-700 delay-300">
                                <div className="p-4 sm:p-5 rounded-2xl bg-primary-light border-2 border-primary-secondary/70 text-left space-y-2.5 sm:space-y-3 shadow-xs">
                                    <div className="flex items-start justify-between gap-2.5">
                                        <div>
                                            <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary-base">
                                                {hasOpenedLink ? "Thank you for reviewing!" : "Share the love"}
                                            </p>
                                            <p className="text-xs sm:text-sm font-semibold text-gray-800 mt-0.5 sm:mt-1">
                                                {primaryPlatformMeta.key === "yelp"
                                                    ? `Find us on Yelp and mention ${flexologistName || "your Flexologist"}.`
                                                    : `Drop a rating on ${primaryPlatformMeta.label} and mention ${flexologistName || "your Flexologist"}!`}
                                            </p>
                                        </div>
                                        <PlatformIcon meta={primaryPlatformMeta} size={15} />
                                    </div>

                                    <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                                        {primaryLink?.message ||
                                            (flexologistName
                                                ? `Mentioning ${flexologistName} helps our team members get recognized and rewarded for great sessions.`
                                                : "Mentioning your Flexologist helps our team get recognized for great sessions.")}
                                    </p>

                                    <div className="pt-1 space-y-2">
                                        {platformLinks.map((link, idx) => {
                                            const meta = getReviewPlatformMeta(link.platform);
                                            return (
                                                <button
                                                    key={`${link.platform}-${idx}`}
                                                    type="button"
                                                    className="w-full py-3.5 sm:py-4 bg-white border-2 border-primary-secondary/80 text-primary-base rounded-xl font-black uppercase tracking-[0.12em] sm:tracking-[0.15em] text-[11px] sm:text-xs flex items-center justify-center gap-2.5 sm:gap-3 hover:bg-primary-light transition-all active:scale-95 group/platform cursor-pointer shadow-xs hover:shadow-md"
                                                    onClick={() => openReview(link.message || "")}
                                                >
                                                    <PlatformIcon meta={meta} size={15} />
                                                    <span>{hasOpenedLink ? `Open ${meta.label} Again` : meta.ctaLabel}</span>
                                                    <ExternalLink size={13} className="text-primary-base/60 group-hover/platform:translate-x-0.5 transition-transform" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {primaryLink && (
                        <ReviewPromptModal
                            open={isPromptOpen}
                            onClose={dismissPrompt}
                            platform={primaryPlatformMeta}
                            employeeName={flexologistName}
                            locationName={employee.location}
                            message={primaryLink.message}
                            hasOpenedLink={hasOpenedLink}
                            onOpenReview={(noteText) => openReview(noteText)}
                        />
                    )}
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 sm:py-14 px-4 sm:px-6 relative overflow-hidden">
                <div className="max-w-xl w-full">
                    <div className="text-center space-y-2 sm:space-y-3 mb-6 sm:mb-10">
                        {employee.customer_name && (
                            <h2 className="text-base sm:text-xl font-bold text-gray-400 capitalize tracking-widest mb-0.5 sm:mb-1">
                                Hi {employee.customer_name}
                            </h2>
                        )}
                        <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-gray-900 tracking-tight text-balance">
                            We value your feedback!
                        </h1>
                        <p className="text-gray-500 font-medium text-xs sm:text-base md:text-lg leading-relaxed">
                            {landingPageData?.data?.landing_page_message || (
                                <>
                                    Please rate your recent experience with our team member{" "}
                                    <span className="text-gray-900 font-bold">{employee.name}</span>.
                                </>
                            )}
                        </p>
                    </div>

                    <div className="bg-white pb-6 sm:pb-8 md:pb-10 p-3.5 sm:p-6 md:p-10 rounded-2xl shadow-2xl shadow-gray-200/50 border border-white/50 space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                        {/* Ratings */}
                        <div className="flex justify-between items-center px-0.5 sm:px-1">
                            {RATINGS.map((r) => (
                                <button
                                    key={r.value}
                                    type="button"
                                    onClick={() => setRating(r.value)}
                                    className={`flex flex-col items-center gap-1.5 sm:gap-3 transition-all duration-300 cursor-pointer group ${rating === r.value
                                        ? "scale-115 sm:scale-125 z-10"
                                        : "hover:scale-110 opacity-70 hover:opacity-100"
                                        }`}
                                >
                                    <span
                                        className={`text-3xl sm:text-4xl md:text-5xl transition-all duration-300 ${rating === r.value
                                            ? "drop-shadow-xl scale-110"
                                            : "grayscale-[30%] group-hover:grayscale-0"
                                            }`}
                                    >
                                        {r.emoji}
                                    </span>
                                    <span
                                        className={`text-[8.5px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all duration-300 ${rating === r.value
                                            ? r.color
                                            : "text-gray-300 group-hover:text-gray-500"
                                            }`}
                                    >
                                        {r.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Employee Card */}
                        <div className="bg-white border-2 border-gray-50 rounded-2xl p-3 sm:p-4 md:p-6 flex items-center gap-3 sm:gap-4 md:gap-6 shadow-xs hover:border-primary-secondary transition-colors duration-500 group/card">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full bg-primary-secondary/50 flex items-center justify-center text-primary-base font-black text-base sm:text-xl md:text-2xl shadow-inner border-2 sm:border-4 border-white transition-transform duration-500 group-hover/card:scale-105 shrink-0">
                                {employee.avatar}
                            </div>
                            <div className="space-y-0.5 sm:space-y-1 md:space-y-1.5 flex-1 min-w-0">
                                <h3 className="text-base sm:text-xl md:text-2xl font-black text-gray-900 tracking-tight truncate">
                                    {employee.name}
                                </h3>
                                {employee.location && (
                                    <p className="text-[11px] sm:text-sm font-bold text-gray-400 uppercase tracking-widest truncate">
                                        {employee.location}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Follow-up Options (Displayed when rating is at or below threshold) */}
                        {isNegative && (
                            <div className="space-y-4 sm:space-y-6 pt-1 sm:pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
                                {followUpOptions.length > 0 && (
                                    <div className="space-y-2.5 sm:space-y-3">
                                        <h3 className="text-center text-sm sm:text-base md:text-lg font-bold text-gray-800">
                                            Select one or more issues
                                        </h3>
                                        <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
                                            {followUpOptions.map((issue) => {
                                                const isSelected = selectedIssues.includes(issue);
                                                return (
                                                    <button
                                                        key={issue}
                                                        type="button"
                                                        onClick={() => toggleIssue(issue)}
                                                        className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full border text-[11px] sm:text-xs md:text-sm font-bold transition-all duration-300 shadow-xs cursor-pointer ${isSelected
                                                            ? "bg-primary-base border-primary-base text-white shadow-md scale-105"
                                                            : "bg-white border-gray-200 text-gray-600 hover:border-primary-base hover:text-primary-base"
                                                            }`}
                                                    >
                                                        {issue}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="text-xs sm:text-sm font-bold text-gray-600 block text-left">
                                        Tell us more (optional)
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Please share any additional details about your experience..."
                                        className="w-full p-3 sm:p-4 border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-primary-base focus:ring-2 focus:ring-primary-base/20 transition-all duration-300 resize-none bg-white shadow-xs"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="space-y-4 sm:space-y-5 pt-1 sm:pt-2">
                            <Button
                                className={`w-full py-4 sm:py-6 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-xs sm:text-sm transition-all duration-500 ${canSubmit
                                    ? "bg-primary-base text-white shadow-xl shadow-primary-base/30 hover:scale-[1.01] active:scale-95 hover:bg-primary-base/90 cursor-pointer"
                                    : "bg-gray-300 text-gray-400 cursor-not-allowed shadow-none"
                                    }`}
                                disabled={!canSubmit || isSubmitting}
                                onClick={handleSubmit}
                            >
                                {isSubmitting ? <Spinner /> : "Submit Feedback"}
                            </Button>
                        </div>
                    </div>

                    <div className="mt-auto py-6 sm:py-8 text-center bg-transparent">
                        <p className="relative z-10 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] sm:tracking-[0.3em] text-gray-300">
                            Powered by <span className="text-primary-base font-bold">Stretchnote</span>
                        </p>
                    </div>
                </div>
            </div>
        );
    };
