import { useQuery, useMutation } from "@tanstack/react-query";
import { loadLandingPage, loadNegativePage, submitReview, submitNegativeReview } from "@/service/review";
import type { LandingPageResponse, NegativePageResponse } from "@/types/review";

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

export const useNegativePage = (token: string | undefined) => {
    return useQuery({
        queryKey: ["negative-page", token],
        queryFn: async () => {
            if (!token) return null;
            const response = await loadNegativePage(token);
            return response.data as NegativePageResponse;
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

export const useSubmitNegativeReview = () => {
    return useMutation({
        mutationFn: (data: { booking_token: string; feedback: string[]; reason: string }) =>
            submitNegativeReview(data),
    });
};
