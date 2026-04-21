import { useQuery, useMutation } from "@tanstack/react-query";
import { loadLandingPage, submitReview } from "@/service/review";
import type { LandingPageResponse } from "@/types/review";

export const useLocationLandingPage = (token: string | undefined) => {
    return useQuery({
        queryKey: ["review-landing-page", token],
        queryFn: async () => {
            if (!token) return null;
            const response = await loadLandingPage(token);
            return response.data as LandingPageResponse;
        },
        enabled: !!token,
    });
};

export const useSubmitReview = () => {
    return useMutation({
        mutationFn: (data: { booking_token: string; feedback: number; feedback_type: string }) =>
            submitReview(data),
    });
};
