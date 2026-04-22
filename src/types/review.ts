export interface ReviewLocation {
    admin_id: number;
    id: number;
    links: any;
    location_id: string;
    location_name: string;
    normalized_location_name: string;
    twilio_phone_number: string | null;
    review_set_up: boolean;
}

export interface NegativeExperience {
    id: number;
    tag: string | null;
    option: string;
    admin_id?: number;
    created_at?: string;
}

export interface ReviewBrandInfo {
    legal_business_name?: string;
    ein?: string;
    business_type?: string;
    business_position?: string;
    website_url?: string;
    business_address?: string;
    business_city?: string;
    business_state?: string;
    business_zip?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    job_title?: string;
}

export interface ReviewSettings extends ReviewBrandInfo {
    flow_name: string;
    message_timing: number;
    negative_threshold: number;
    phone_recipients: string[];
    email_recipients: string[];
    initial_text_delay: string;
    initial_text_content: string;
    landing_page_content: string;
    message_links: { platform: string; url: string }[];
    show_employee_profile: boolean;
    negative_experience_items: number[];
    negative_follow_up_content: string;
}

export interface LandingPageData {
    booking_id: number;
    customer_name: string;
    employee_name: string;
    flexologist_id: number;
    landing_page_message: string;
    location_name: string;
}

export interface LandingPageResponse {
    data: LandingPageData;
    links?: string | { platform: string; link_url: string }[];
    message: string;
    status: string;
}

export interface Review {
    admin_id: number;
    booking_id: number;
    clubready_bookings: {
        booking_id: string;
        booking_time: string;
        client_name: string;
        created_at: string;
        flexologist_name: string;
    };
    created_at: string;
    feedback: string;
    feedback_type: string;
    id: number;
    location_id: number;
    locations: {
        location_name: string;
    };

    reason: string;
}

export interface GoogleReviewMention {
    created_at: string | null;
    flexologist_id: number;
    flexologist_name: string;
    google_review_id: number;
    id: number;
    is_confirmed: boolean;
    points: string;
}

export interface GoogleReview {
    author_name: string;
    created_at: string | null;
    flexologists_mentioned: string;
    id: number;
    iso_date: string;
    location_id: string;
    mentions: GoogleReviewMention[];
    needs_manual_review: boolean;
    rating: string;
    review_id: string;
    snippet: string;
}
