import { useState, useMemo } from "react";
import { useParams } from "react-router";
import { Button, Spinner } from "@/components/shared";
import { renderSuccessToast, renderErrorToast } from "@/components/utils";
import { CheckCircle2, Star, ExternalLink } from "lucide-react";
import { useLocationLandingPage, useSubmitReview, useSubmitNegativeReview } from "@/hooks/useReview";
import { FullLoader } from "@/components/shared/FullLoader";
import { SvgIcon } from "@/components/shared/SvgIcon";
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
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            renderErrorToast(err.response?.data?.error || "Failed to submit feedback. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderPlatformIcon = (platform: string) => {
        const p = platform?.toLowerCase().trim();
        if (p === "google") {
            return (
                <div className="p-1.5 bg-white rounded-lg shadow-xs group-hover/platform:scale-110 transition-transform">
                    <SvgIcon name="google" width={18} height={18} />
                </div>
            );
        }
        if (p === "facebook") {
            return (
                <div className="p-1.5 bg-white rounded-lg shadow-xs group-hover/platform:scale-110 transition-transform">
                    <SvgIcon name="facebook" width={18} height={18} />
                </div>
            );
        }
        if (p === "yelp") {
            return (
                <div className="p-1.5 bg-white rounded-lg shadow-xs group-hover/platform:scale-110 transition-transform">
                    <SvgIcon name="yelp" width={18} height={18} />
                </div>
            );
        }
        return (
            <div className="p-1.5 bg-primary-light rounded-lg shadow-xs group-hover/platform:scale-110 transition-transform">
                <Star size={18} className="text-primary-base fill-primary-base" />
            </div>
        );
    };

    if (isLoading) {
        return <FullLoader text="Loading review page..." />;
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="max-w-md w-full">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-500 animate-in zoom-in duration-700 delay-200">
                        <CheckCircle2 size={45} />
                    </div>
                    <h1 className="text-xl md:text-3xl font-black text-gray-900 mb-3">Thank You!</h1>
                    <p className="text-gray-500 font-medium text-base md:text-lg">
                        {isNegative
                            ? (landingPageData?.data?.negative_follow_up_message ||
                                "Thank you for your feedback. We are sorry to hear about your experience. A team member will follow up shortly.")
                            : "Your feedback has been received."}
                    </p>

                    {platformLinks.length > 0 && (
                        <div className="mt-10 space-y-4 animate-in slide-in-from-bottom-4 duration-700 delay-300">
                            <p className="text-sm font-medium text-gray-400">
                                {platformLinks[0]?.message || "Please leave a review and mention your favorite Flexologist and Member Advisor. They earn rewards from your positive feedback!"}
                            </p>
                            <div className="space-y-3">
                                {platformLinks.map((link, idx) => (
                                    <button
                                        key={`${link.platform}-${idx}`}
                                        className="w-full py-4 md:py-5 bg-white border-2 border-primary-secondary/60 text-primary-base rounded-xl font-black uppercase tracking-[0.15em] text-xs flex items-center justify-center gap-3 hover:bg-primary-light/50 transition-all active:scale-95 group/platform cursor-pointer shadow-xs hover:shadow-md"
                                        onClick={() => window.open(link.link_url, "_blank")}
                                    >
                                        {renderPlatformIcon(link.platform)}
                                        <span>Leave a review on {link.platform || "Platform"}</span>
                                        <ExternalLink size={14} className="text-primary-base/60 group-hover/platform:translate-x-0.5 transition-transform" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-14 px-6 relative overflow-hidden">
            <div className="max-w-xl w-full">
                <div className="text-center space-y-3 mb-10">
                    {employee.customer_name && (
                        <h2 className="text-xl font-bold text-gray-400 capitalize tracking-widest mb-1">
                            Hi {employee.customer_name}
                        </h2>
                    )}
                    <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight text-balance">
                        We value your feedback!
                    </h1>
                    <p className="text-gray-500 font-medium text-base md:text-lg leading-relaxed">
                        {landingPageData?.data?.landing_page_message || (
                            <>
                                Please rate your recent experience with our team member{" "}
                                <span className="text-gray-900 font-bold">{employee.name}</span>.
                            </>
                        )}
                    </p>
                </div>

                <div className="bg-white pb-8 md:pb-10 p-4 md:p-10 rounded-2xl shadow-2xl shadow-gray-200/50 border border-white/50 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                    {/* Ratings */}
                    <div className="flex justify-between items-center px-1">
                        {RATINGS.map((r) => (
                            <button
                                key={r.value}
                                type="button"
                                onClick={() => setRating(r.value)}
                                className={`flex flex-col items-center gap-3 transition-all duration-300 cursor-pointer group ${rating === r.value
                                    ? "scale-125 z-10"
                                    : "hover:scale-110 opacity-70 hover:opacity-100"
                                    }`}
                            >
                                <span
                                    className={`text-4xl md:text-5xl transition-all duration-300 ${rating === r.value
                                        ? "drop-shadow-xl scale-110"
                                        : "grayscale-[30%] group-hover:grayscale-0"
                                        }`}
                                >
                                    {r.emoji}
                                </span>
                                <span
                                    className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${rating === r.value
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
                    <div className="bg-white border-2 border-gray-50 rounded-2xl p-4 md:p-6 flex items-center gap-4 md:gap-6 shadow-xs hover:border-primary-secondary transition-colors duration-500 group/card">
                        <div className="w-16 h-16 md:w-18 md:h-18 rounded-full bg-primary-secondary/50 flex items-center justify-center text-primary-base font-black text-xl md:text-2xl shadow-inner border-4 border-white transition-transform duration-500 group-hover/card:scale-105">
                            {employee.avatar}
                        </div>
                        <div className="space-y-1 md:space-y-1.5 flex-1">
                            <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                                {employee.name}
                            </h3>
                            {employee.location && (
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                    {employee.location}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Follow-up Options (Displayed when rating is at or below threshold) */}
                    {isNegative && (
                        <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
                            {followUpOptions.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-center text-base md:text-lg font-bold text-gray-800">
                                        Select one or more issues
                                    </h3>
                                    <div className="flex flex-wrap justify-center gap-2.5">
                                        {followUpOptions.map((issue) => {
                                            const isSelected = selectedIssues.includes(issue);
                                            return (
                                                <button
                                                    key={issue}
                                                    type="button"
                                                    onClick={() => toggleIssue(issue)}
                                                    className={`px-5 py-2.5 rounded-full border text-xs md:text-sm font-bold transition-all duration-300 shadow-xs cursor-pointer ${isSelected
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

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 block text-left">
                                    Tell us more (optional)
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Please share any additional details about your experience..."
                                    className="w-full p-4 border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-primary-base focus:ring-2 focus:ring-primary-base/20 transition-all duration-300 resize-none bg-white shadow-xs"
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="space-y-5 pt-2">
                        <Button
                            className={`w-full py-6 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-[0.2em] text-sm transition-all duration-500 ${canSubmit
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

                <div className="mt-auto py-8 text-center bg-transparent">
                    <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
                        Powered by <span className="text-primary-base font-bold">Stretchnote</span>
                    </p>
                </div>
            </div>
        </div>
    );
};
