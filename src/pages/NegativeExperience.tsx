import { useState, useMemo } from "react";
import { useParams } from "react-router";
import { Button, Spinner } from "@/components/shared";
import { renderSuccessToast, renderErrorToast } from "@/components/utils";
import { CheckCircle2 } from "lucide-react";
import { useNegativePage, useSubmitNegativeReview } from "@/hooks/useReview";
import { FullLoader } from "@/components/shared/FullLoader";

// const RATINGS = [
//     { label: "Terrible", emoji: "😫", value: 1, color: "text-red-500", bg: "bg-red-50" },
//     { label: "Bad", emoji: "☹️", value: 2, color: "text-orange-500", bg: "bg-orange-50" },
//     { label: "Okay", emoji: "😐", value: 3, color: "text-yellow-500", bg: "bg-yellow-50" },
//     { label: "Good", emoji: "🙂", value: 4, color: "text-lime-500", bg: "bg-lime-50" },
//     { label: "Great", emoji: "🥰", value: 5, color: "text-emerald-500", bg: "bg-emerald-50" },
// ];

export const NegativeExperience = () => {
    const { token } = useParams();
    const { data: negativePageData, isLoading } = useNegativePage(token);
    const { mutate: submitMutation, isPending: isSubmitting } = useSubmitNegativeReview();
    const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
    const [reason, setReason] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const canSubmit = selectedIssues.length > 0 || reason.trim().length > 0;

    const customerName = negativePageData?.data?.customer_name || "";
    const flexologistName = negativePageData?.data?.flexologist_name || "";
    const locationName = negativePageData?.data?.location || "";

    const followUpOptions = useMemo(() => {
        if (!negativePageData?.data?.negative_follow_up_options) return [];
        try {
            const parsed = typeof negativePageData.data.negative_follow_up_options === "string"
                ? JSON.parse(negativePageData.data.negative_follow_up_options)
                : negativePageData.data.negative_follow_up_options;
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error("Failed to parse negative_follow_up_options:", e);
            return [];
        }
    }, [negativePageData]);

    const toggleIssue = (issue: string) => {
        setSelectedIssues(prev =>
            prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
        );
    };

    const handleSubmit = () => {
        if (!token || !canSubmit) return;

        submitMutation({
            booking_token: token,
            feedback: selectedIssues,
            reason: reason.trim(),
        }, {
            onSuccess: () => {
                setSubmitted(true);
                renderSuccessToast("Thank you for your feedback!");
            },
            onError: (error: any) => {
                renderErrorToast(error.response?.data?.error || "Failed to submit feedback. Please try again.");
            }
        });
    };

    if (isLoading) {
        return <FullLoader text="Loading feedback page..." />;
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="max-w-md w-full">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500">
                        <CheckCircle2 size={48} />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Thank You!</h1>
                    <p className="text-gray-500 font-medium leading-relaxed text-lg">
                        We're sorry you had a poor experience. Your feedback has been received and
                        our management team will review it shortly.
                    </p>
                    {/* <div className="mt-12">
                        <Button
                            className="w-full bg-primary-base py-5 rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary-base/20"
                            onClick={() => window.close()}
                        >
                            Close Tab
                        </Button>
                    </div> */}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-6 relative overflow-hidden">


            <div className="max-w-xl mx-auto w-full flex flex-col min-h-[calc(100vh-8rem)]">
                <div className="flex-1 space-y-7">
                    <div className="text-center space-y-3">
                        {customerName && (
                            <h2 className="text-xl font-bold text-gray-400 capitalize tracking-widest mb-1">
                                Hi {customerName}
                            </h2>
                        )}
                        <h1 className="text-[32px] font-black text-[#1F2937] tracking-tight">We value your feedback!</h1>
                        <p className="text-gray-500 font-medium text-lg leading-relaxed">
                            Please let us know about your recent experience
                            {flexologistName ? (
                                <> with <span className="font-bold capitalize">{flexologistName}</span></>
                            ) : null}
                            {locationName ? (
                                <> at <span className="font-bold">{locationName}</span></>
                            ) : null}
                            .
                        </p>
                    </div>

                    {/* Rating section commented out for now */}
                    {/* <div className="flex justify-between items-center px-2">
                        {RATINGS.map((r) => (
                            <div
                                key={r.value}
                                className={`flex flex-col items-center gap-3 transition-all duration-500 p-2 rounded-3xl ${initialRating === r.value
                                    ? `bg-red-100/50 scale-110 shadow-sm border border-red-100`
                                    : "opacity-40"
                                    }`}
                            >
                                <span className={`text-4xl md:text-5xl`}>
                                    {r.emoji}
                                </span>
                                <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${initialRating === r.value ? r.color : "text-gray-400"
                                    }`}>
                                    {r.label}
                                </span>
                            </div>
                        ))}
                    </div> */}

                    <div className="text-center">
                        <h2 className="text-lg font-bold text-gray-800 tracking-tight">Select one or more issues</h2>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        {followUpOptions.map((issue: string) => {
                            const isSelected = selectedIssues.includes(issue);
                            return (
                                <button
                                    key={issue}
                                    onClick={() => toggleIssue(issue)}
                                    className={`px-6 py-3 rounded-full border border-gray-200 font-bold text-sm transition-all duration-300 shadow-sm ${isSelected
                                        ? "bg-primary-base border-primary-base text-white shadow-md scale-105"
                                        : "bg-white text-gray-600 hover:border-primary-base hover:text-primary-base"
                                        }`}
                                >
                                    {issue}
                                </button>
                            );
                        })}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-600 block text-left">
                            Tell us more (optional)
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Please share any additional details about your experience..."
                            className="w-full p-4 border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-primary-base focus:ring-2 focus:ring-primary-base/20 transition-all duration-300 resize-none bg-white shadow-sm"
                            rows={5}
                        />
                    </div>

                    <div className="pt-4">
                        <Button
                            className={`w-full py-6 flex items-center justify-center  rounded-2xl font-black capitalize tracking-widest text-sm shadow-xl active:scale-[0.98] transition-all ${canSubmit ? "text-white bg-primary-base hover:bg-primary-base/80 shadow-blue-700/20" : "bg-gray-400 text-gray-500 cursor-not-allowed shadow-none"}`}
                            onClick={handleSubmit}
                            disabled={isSubmitting || !canSubmit}
                        >
                            {isSubmitting ? <Spinner /> : "SUBMIT FEEDBACK"}
                        </Button>
                    </div>
                </div>
                <div className="mt-auto py-8 text-center bg-transparent">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
                        Powered by <span className="text-primary-base">Stretchnote</span>
                    </p>
                </div>
            </div>
        </div>
    );
};
