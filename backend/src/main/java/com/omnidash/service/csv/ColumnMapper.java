package com.omnidash.service.csv;

import java.util.*;

/**
 * Skills 01 §1.4 입력 어댑터.
 * 한국어·영어 컬럼명을 표준 필드로 자동 매핑.
 */
public class ColumnMapper {

    /** 표준 필드 → 후보 헤더 (LinkedHashMap으로 순서 보장). */
    private static final Map<String, List<String>> DICTIONARY = new LinkedHashMap<>();
    static {
        DICTIONARY.put("asset_id",       List.of("asset_id", "ticker", "symbol", "code", "isin", "종목코드", "티커", "코드", "심볼"));
        DICTIONARY.put("asset_name",     List.of("asset_name", "name", "asset", "security", "종목명", "종목", "이름"));
        DICTIONARY.put("asset_class",    List.of("asset_class", "class", "type", "asset_type", "자산구분", "자산종류", "분류"));
        DICTIONARY.put("sector",         List.of("sector", "industry", "섹터", "업종", "산업"));
        DICTIONARY.put("quantity",       List.of("quantity", "qty", "shares", "units", "holdings", "수량", "보유수량", "주식수", "보유량"));
        DICTIONARY.put("avg_cost",       List.of("avg_cost", "avg_price", "cost_basis", "avgcost", "평단가", "매입가", "평균매입가", "매수단가"));
        DICTIONARY.put("price",          List.of("price", "exec_price", "단가", "매매단가", "체결가"));
        DICTIONARY.put("fees",           List.of("fees", "fee", "commission", "costs", "수수료", "거래비용", "수수료세금"));
        DICTIONARY.put("executed_at",    List.of("executed_at", "trade_date", "execution_date", "exec_date", "거래일", "매매일자", "일자", "체결일"));
        DICTIONARY.put("acquired_at",    List.of("acquired_at", "buy_date", "purchase_date", "매수일", "취득일"));
        DICTIONARY.put("side",           List.of("side", "type", "action", "구분", "매매구분", "거래구분", "매수매도"));
        DICTIONARY.put("tax_treatment",  List.of("tax_treatment", "tax", "세제구분", "과세"));
        DICTIONARY.put("base_currency",  List.of("base_currency", "currency", "ccy", "통화", "결제통화"));
        DICTIONARY.put("transaction_id", List.of("transaction_id", "tx_id", "거래번호"));
    }

    /**
     * 입력 헤더를 표준 필드로 매핑.
     * 전역 최적 매칭: 모든 (std_field, header) 쌍의 점수를 계산한 뒤
     * 점수 내림차순으로 그리디 할당. 점수가 낮은 쌍이 먼저 처리되어 정확 매칭을
     * 가로채는 문제(map iteration order 의존성)를 방지한다.
     */
    public static Mapping resolve(List<String> headers) {
        record Candidate(String stdField, int idx, double score) {}
        List<Candidate> candidates = new ArrayList<>();

        for (Map.Entry<String, List<String>> e : DICTIONARY.entrySet()) {
            String stdField = e.getKey();
            for (int i = 0; i < headers.size(); i++) {
                double score = score(headers.get(i), e.getValue());
                if (score >= 0.6) candidates.add(new Candidate(stdField, i, score));
            }
        }
        // 높은 점수가 먼저 할당되도록 정렬
        candidates.sort((a, b) -> Double.compare(b.score, a.score));

        Map<String, Integer> mapped = new LinkedHashMap<>();
        Set<Integer> usedIdx = new HashSet<>();
        Set<String> usedField = new HashSet<>();
        List<String> warnings = new ArrayList<>();

        for (Candidate c : candidates) {
            if (usedField.contains(c.stdField) || usedIdx.contains(c.idx)) continue;
            mapped.put(c.stdField, c.idx);
            usedField.add(c.stdField);
            usedIdx.add(c.idx);
            if (c.score < 0.85) {
                warnings.add(String.format(
                        "헤더 매핑 신뢰도 낮음: '%s' → %s (score=%.2f)",
                        headers.get(c.idx), c.stdField, c.score));
            }
        }
        return new Mapping(mapped, warnings);
    }

    private static double score(String header, List<String> candidates) {
        String h = normalize(header);
        double best = 0.0;
        for (String c : candidates) {
            String cn = normalize(c);
            double s;
            if (h.equals(cn)) s = 1.0;
            else if (h.contains(cn) || cn.contains(h)) s = 0.85;
            else {
                int dist = levenshtein(h, cn);
                if (dist <= 2 && Math.max(h.length(), cn.length()) >= 4) {
                    s = 0.6 + (2 - dist) * 0.1;
                } else s = 0.0;
            }
            if (s > best) best = s;
        }
        return best;
    }

    private static String normalize(String s) {
        if (s == null) return "";
        return s.toLowerCase(Locale.ROOT)
                .replaceAll("[\\s_\\-/()]", "")
                .trim();
    }

    private static int levenshtein(String a, String b) {
        int[][] d = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) d[i][0] = i;
        for (int j = 0; j <= b.length(); j++) d[0][j] = j;
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                d[i][j] = Math.min(Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1), d[i - 1][j - 1] + cost);
            }
        }
        return d[a.length()][b.length()];
    }

    public record Mapping(Map<String, Integer> fieldToIdx, List<String> warnings) {
        public Integer idx(String field) { return fieldToIdx.get(field); }
        public boolean has(String field) { return fieldToIdx.containsKey(field); }
    }
}
