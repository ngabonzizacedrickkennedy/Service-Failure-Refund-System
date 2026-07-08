package com.example.Refund_Processing_Service.model;

public enum ProjectCategory {
    SOFTWARE_DEVELOPMENT,
    DESIGN_CREATIVE,
    DATA_AI,
    MANAGEMENT,
    ENGINEERING,
    CONSTRUCTION,
    MARKETING,
    FINANCE_ACCOUNTING,
    LEGAL_COMPLIANCE,
    HEALTHCARE,
    EDUCATION_TRAINING,
    LOGISTICS,
    OTHER;

    public String getDisplayName() {
        return switch (this) {
            case SOFTWARE_DEVELOPMENT -> "Software Development";
            case DESIGN_CREATIVE      -> "Design & Creative";
            case DATA_AI              -> "Data & AI";
            case MANAGEMENT           -> "Project & Product Management";
            case ENGINEERING          -> "Engineering";
            case CONSTRUCTION         -> "Construction";
            case MARKETING            -> "Marketing & Content";
            case FINANCE_ACCOUNTING   -> "Finance & Accounting";
            case LEGAL_COMPLIANCE     -> "Legal & Compliance";
            case HEALTHCARE           -> "Healthcare";
            case EDUCATION_TRAINING   -> "Education & Training";
            case LOGISTICS            -> "Logistics & Supply Chain";
            case OTHER                -> "Other";
        };
    }
}
