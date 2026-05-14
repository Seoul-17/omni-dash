package com.omnidash.service.metrics;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 데모용 고정 환율 — 외부 API 미사용 (개요.md "심사자 키 없이 확인 가능" 충족).
 * 실서비스에서는 한국은행 OpenAPI 등으로 일일 환율 fetch 권장.
 */
@Component
public class FxRates {

    // 1 단위 currency → KRW 환산 (2026 추정).
    private static final Map<String, Double> TO_KRW = Map.of(
            "KRW", 1.0,
            "USD", 1350.0,
            "EUR", 1470.0,
            "JPY", 9.2,
            "CNY", 188.0,
            "GBP", 1715.0,
            "HKD", 173.0
    );

    /** from 통화 → to 통화 환율. 미상시 1.0 fallback. */
    public double rate(String from, String to) {
        if (from == null || to == null || from.equalsIgnoreCase(to)) return 1.0;
        Double fromToKrw = TO_KRW.get(from.toUpperCase());
        Double toToKrw = TO_KRW.get(to.toUpperCase());
        if (fromToKrw == null || toToKrw == null || toToKrw == 0) return 1.0;
        return fromToKrw / toToKrw;
    }
}
