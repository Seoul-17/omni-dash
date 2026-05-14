package com.omnidash.dto;

/** 업로드 시 동반되는 분석 설정 (Skills 01 §1.1 analysis_config). */
public record UploadRequest(
        String baseCurrency,
        String riskProfile,        // conservative | moderate | aggressive
        String audience,           // novice | intermediate | expert
        String locale,             // ko-KR | en-US | auto
        String mode                // quick | standard | full
) {
    public UploadRequest withDefaults() {
        return new UploadRequest(
                baseCurrency != null && !baseCurrency.isBlank() ? baseCurrency : "KRW",
                riskProfile != null && !riskProfile.isBlank() ? riskProfile : "moderate",
                audience != null && !audience.isBlank() ? audience : "intermediate",
                locale != null && !locale.isBlank() ? locale : "ko-KR",
                mode != null && !mode.isBlank() ? mode : "standard"
        );
    }
}
