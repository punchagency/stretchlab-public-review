import { useState } from "react";
import { useParams } from "react-router";
import { Button, Spinner } from "@/components/shared";
import { renderSuccessToast, renderErrorToast } from "@/components/utils";
import { CheckCircle2 } from "lucide-react";
import { useLocationLandingPage, useSubmitReview } from "@/hooks/useReview";
import { FullLoader } from "@/components/shared/FullLoader";
import { SvgIcon } from "@/components/shared/SvgIcon";

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
    const { mutate: submitMutation, isPending: isSubmitting } = useSubmitReview();
    const [rating, setRating] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const platformLinks = (() => {
        if (!landingPageData?.links) return [];
        try {
            return typeof landingPageData.links === 'string'
                ? JSON.parse(landingPageData.links)
                : landingPageData.links;
        } catch (e) {
            console.error("Failed to parse links:", e);
            return [];
        }
    })();

    const employee = {
        name: landingPageData?.data?.employee_name || "Employee",
        location: landingPageData?.data?.location_name || "",
        avatar: landingPageData?.data?.employee_name ? landingPageData.data.employee_name.charAt(0) : "E",
        booking_id: landingPageData?.data?.booking_id,
        customer_name: landingPageData?.data?.customer_name,
    };

    if (isLoading) {
        return <FullLoader text="Loading review page..." />
    }

    const handleSubmit = async () => {
        if (!rating || !token) return;

        submitMutation({
            booking_token: token,
            feedback: rating,
            feedback_type: "feedback"
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


    if (submitted) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="max-w-md w-full">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500 animate-in zoom-in duration-700 delay-200">
                        <CheckCircle2 size={48} />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Thank You!</h1>
                    <p className="text-gray-500 font-medium leading-relaxed text-lg">
                        Your feedback has been received.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-6 relative overflow-hidden">

            <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-light/40 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary-secondary/30 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-xl w-full">
                <div className="text-center space-y-3 mb-10">
                    {employee.customer_name && (
                        <h2 className="text-xl font-bold text-gray-400 capitalize tracking-widest mb-1">
                            Hi {employee.customer_name}
                        </h2>
                    )}
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight text-balance">We value your feedback!</h1>
                    <p className="text-gray-500 font-medium text-lg leading-relaxed">
                        {landingPageData?.data?.landing_page_message || (
                            <>Please rate your recent experience with our team member <span className="text-gray-900 font-bold">{employee.name}</span>.</>
                        )}
                    </p>
                </div>

                <div className="bg-white p-10 md:p-14 rounded-[3.5rem] shadow-2xl shadow-gray-200/50 border border-white/50 space-y-12 animate-in slide-in-from-bottom-8 duration-700">

                    <div className="flex justify-between items-center px-2">
                        {RATINGS.map((r) => (
                            <button
                                key={r.value}
                                onClick={() => setRating(r.value)}
                                className={`flex flex-col items-center gap-4 transition-all duration-500 group ${rating === r.value ? "scale-125 z-10" : "hover:scale-110 opacity-70 hover:opacity-100"
                                    }`}
                            >
                                <span className={`text-5xl md:text-6xl transition-all duration-500 ${rating === r.value ? "drop-shadow-xl" : "grayscale-[30%] group-hover:grayscale-0"}`}>
                                    {r.emoji}
                                </span>
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${rating === r.value ? r.color : "text-gray-300 group-hover:text-gray-500"
                                    }`}>
                                    {r.label}
                                </span>
                            </button>
                        ))}
                    </div>


                    <div className="bg-white border-2 border-gray-50 rounded-[2.5rem] p-8 flex items-center gap-6 shadow-sm hover:border-primary-secondary transition-colors duration-500 group/card">
                        <div className="w-20 h-20 rounded-full bg-primary-secondary/50 flex items-center justify-center text-primary-base font-black text-3xl shadow-inner border-4 border-white transition-transform duration-500 group-hover/card:scale-105">
                            {employee.avatar}
                        </div>
                        <div className="space-y-1.5 flex-1">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{employee.name}</h3>
                            {employee.location && (
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{employee.location}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-5 pt-4">
                        <Button
                            className={`w-full py-6 rounded-lg flex items-center justify-center gap-2 font-black uppercase tracking-[0.2em] text-sm transition-all duration-700 ${rating ? "bg-primary-base text-white shadow-2xl shadow-primary-base/40 hover:scale-[1.02] active:scale-95" : "bg-gray-100 text-gray-300 cursor-not-allowed"
                                }`}
                            disabled={!rating || isSubmitting}
                            onClick={handleSubmit}
                        >
                            {isSubmitting ? <Spinner /> : "Submit Feedback"}
                        </Button>

                        {platformLinks.map((link: { platform: string; link_url: string }, index: number) => (
                            <button
                                key={index}
                                className="w-full py-5 bg-white border-2 border-primary-secondary/30 text-primary-base rounded-xl font-black uppercase tracking-[0.15em] text-xs flex items-center justify-center gap-4 hover:bg-primary-light/50 transition-all active:scale-95 group/platform"
                                onClick={() => window.open(link.link_url, "_blank")}
                            >
                                {link.platform}
                                <div className="p-1.5 bg-white rounded-lg shadow-sm group-hover/platform:shadow-md transition-all group-hover/platform:scale-110">
                                    <SvgIcon name={link.platform.toLowerCase() as any} width={18} height={18} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto py-8 text-center bg-transparent">
                    <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
                        Powered by <span className="text-primary-base">Stretchnote</span>
                    </p>
                </div>
            </div>
        </div>
    );
};
