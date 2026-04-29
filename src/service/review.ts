import { api } from "./api";

export const loadLandingPage = async (token: string) => {
    return api.post("/admin/review/load-landing-page", { booking_token: token });
};

export const loadNegativePage = async (token: string) => {
    return api.post("/admin/review/load-negative-page", { booking_token: token });
};

export const submitReview = async (data: { booking_token: string; feedback: number; feedback_type: string }) => {
    return api.post("/admin/review/submit-review", data);
};

export const submitNegativeReview = async (data: { booking_token: string; feedback: string[]; reason: string }) => {
    return api.post("/admin/review/submit-negative-review", data);
};
