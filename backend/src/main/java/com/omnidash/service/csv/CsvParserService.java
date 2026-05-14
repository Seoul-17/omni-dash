package com.omnidash.service.csv;

import com.omnidash.domain.entity.PositionEntity;
import com.omnidash.domain.entity.TransactionEntity;
import com.omnidash.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * CSV → 표준 스키마 변환. Skills 01 §1.2, §1.4 구현.
 * 입력이 거래내역인지 잔고인지 자동 감지.
 */
@Slf4j
@Service
public class CsvParserService {

    public ParsedCsv parse(InputStream in) {
        try (CSVParser parser = CSVFormat.DEFAULT
                .builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setTrim(true)
                .setIgnoreEmptyLines(true)
                .build()
                .parse(new InputStreamReader(in, StandardCharsets.UTF_8))) {

            List<String> headers = parser.getHeaderNames();
            ColumnMapper.Mapping mapping = ColumnMapper.resolve(headers);
            List<CSVRecord> records = parser.getRecords();
            List<String> warnings = new ArrayList<>(mapping.warnings());

            // 입력 유형 감지: side 컬럼이 있고 buy/sell 등이 채워져 있으면 거래내역.
            boolean isTransactions = mapping.has("side") && hasValidSides(records, mapping);
            if (isTransactions) {
                return parseTransactions(records, mapping, warnings);
            } else {
                return parseHoldings(records, mapping, warnings);
            }
        } catch (Exception e) {
            log.error("CSV parse failed", e);
            throw ApiException.badRequest("CSV 파싱 실패: " + e.getMessage());
        }
    }

    private boolean hasValidSides(List<CSVRecord> records, ColumnMapper.Mapping m) {
        Integer idx = m.idx("side");
        if (idx == null) return false;
        Set<String> ok = Set.of("buy", "sell", "dividend", "split", "fee", "deposit", "withdrawal",
                "매수", "매도", "배당");
        return records.stream().anyMatch(r -> {
            String v = safeGet(r, idx);
            return v != null && ok.contains(v.toLowerCase(Locale.ROOT));
        });
    }

    // ─────────────────── 잔고 입력 처리 ───────────────────

    private ParsedCsv parseHoldings(List<CSVRecord> records, ColumnMapper.Mapping m, List<String> warnings) {
        if (!m.has("asset_id")) throw ApiException.badRequest("종목코드(asset_id)에 해당하는 컬럼을 찾지 못했습니다.");
        if (!m.has("quantity")) throw ApiException.badRequest("수량(quantity)에 해당하는 컬럼을 찾지 못했습니다.");

        List<PositionEntity> positions = new ArrayList<>();
        for (CSVRecord r : records) {
            String assetId = safeGet(r, m.idx("asset_id"));
            if (assetId == null || assetId.isBlank()) {
                warnings.add("asset_id 누락 행 스킵: 행 " + r.getRecordNumber());
                continue;
            }
            BigDecimal qty = parseDecimalSafe(safeGet(r, m.idx("quantity")));
            if (qty == null || qty.signum() <= 0) {
                warnings.add("수량 0 또는 누락 행 스킵: " + assetId);
                continue;
            }
            BigDecimal avgCost = m.has("avg_cost") ? parseDecimalSafe(safeGet(r, m.idx("avg_cost"))) : null;
            if (avgCost == null) {
                warnings.add("평단가 누락 (보정): " + assetId);
                avgCost = BigDecimal.ZERO;
            }

            String assetClass = m.has("asset_class")
                    ? normalizeAssetClass(safeGet(r, m.idx("asset_class")))
                    : "equity";

            positions.add(PositionEntity.builder()
                    .id(UUID.randomUUID())
                    .assetId(assetId.trim())
                    .assetName(m.has("asset_name") ? safeGet(r, m.idx("asset_name")) : assetId)
                    .assetClass(assetClass)
                    .sector(m.has("sector") ? safeGet(r, m.idx("sector")) : null)
                    .quantity(qty)
                    .avgCost(avgCost)
                    .weight(BigDecimal.ZERO) // 잠정값 — 평가 단계에서 재계산
                    .baseCurrency(m.has("base_currency") ? upper(safeGet(r, m.idx("base_currency"))) : null)
                    .acquiredAt(parseLocalDateSafe(m.has("acquired_at")
                            ? safeGet(r, m.idx("acquired_at"))
                            : (m.has("executed_at") ? safeGet(r, m.idx("executed_at")) : null)))
                    .build());
        }

        if (positions.isEmpty()) throw ApiException.badRequest("유효한 자산 행이 없습니다.");

        // weight 재계산 (현재 가격 모를 때 임시로 avg_cost × qty 기준)
        BigDecimal totalValue = positions.stream()
                .map(p -> p.getAvgCost().multiply(p.getQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalValue.signum() > 0) {
            for (PositionEntity p : positions) {
                BigDecimal v = p.getAvgCost().multiply(p.getQuantity());
                p.setWeight(v.divide(totalValue, 6, java.math.RoundingMode.HALF_UP));
            }
        }

        return new ParsedCsv(InputKind.HOLDINGS, positions, List.of(), warnings);
    }

    // ─────────────────── 거래내역 입력 처리 ───────────────────

    private ParsedCsv parseTransactions(List<CSVRecord> records, ColumnMapper.Mapping m, List<String> warnings) {
        if (!m.has("asset_id")) throw ApiException.badRequest("종목코드(asset_id) 컬럼을 찾지 못했습니다.");
        List<TransactionEntity> txs = new ArrayList<>();

        for (CSVRecord r : records) {
            String assetId = safeGet(r, m.idx("asset_id"));
            if (assetId == null || assetId.isBlank()) continue;

            String side = normalizeSide(m.has("side") ? safeGet(r, m.idx("side")) : "buy");
            BigDecimal qty = parseDecimalSafe(m.has("quantity") ? safeGet(r, m.idx("quantity")) : "0");
            BigDecimal price = parseDecimalSafe(m.has("price") ? safeGet(r, m.idx("price")) : "0");
            BigDecimal fees = parseDecimalSafe(m.has("fees") ? safeGet(r, m.idx("fees")) : "0");
            OffsetDateTime executedAt = parseOffsetDateTimeSafe(m.has("executed_at")
                    ? safeGet(r, m.idx("executed_at"))
                    : null);
            if (executedAt == null) executedAt = OffsetDateTime.now(ZoneOffset.UTC);
            String tax = m.has("tax_treatment") ? safeGet(r, m.idx("tax_treatment")) : "pre_tax";

            txs.add(TransactionEntity.builder()
                    .id(UUID.randomUUID())
                    .transactionId(m.has("transaction_id") ? safeGet(r, m.idx("transaction_id")) : null)
                    .assetId(assetId.trim())
                    .side(side)
                    .quantity(qty == null ? BigDecimal.ZERO : qty)
                    .price(price == null ? BigDecimal.ZERO : price)
                    .fees(fees == null ? BigDecimal.ZERO : fees)
                    .executedAt(executedAt)
                    .taxTreatment(tax == null || tax.isBlank() ? "pre_tax" : tax.toLowerCase(Locale.ROOT))
                    .build());
        }
        if (txs.isEmpty()) throw ApiException.badRequest("유효한 거래 행이 없습니다.");

        // Skills 01 §1.2.2 거래내역 → 잔고 변환 (moving_avg 기본)
        List<PositionEntity> positions = aggregateToHoldings(txs);
        warnings.add("거래내역 기반 산출, 평단가는 moving_avg법");
        return new ParsedCsv(InputKind.TRANSACTIONS, positions, txs, warnings);
    }

    private List<PositionEntity> aggregateToHoldings(List<TransactionEntity> txs) {
        Map<String, List<TransactionEntity>> byAsset = txs.stream()
                .collect(Collectors.groupingBy(TransactionEntity::getAssetId, LinkedHashMap::new, Collectors.toList()));
        List<PositionEntity> result = new ArrayList<>();
        for (var entry : byAsset.entrySet()) {
            String assetId = entry.getKey();
            List<TransactionEntity> list = entry.getValue();
            BigDecimal qty = BigDecimal.ZERO;
            BigDecimal costNumerator = BigDecimal.ZERO;   // Σ(buy.qty × buy.price + fees)
            BigDecimal costDenominator = BigDecimal.ZERO; // Σ(buy.qty)
            LocalDate firstBuy = null;

            for (TransactionEntity t : list) {
                switch (t.getSide()) {
                    case "buy" -> {
                        qty = qty.add(t.getQuantity());
                        costNumerator = costNumerator
                                .add(t.getQuantity().multiply(t.getPrice()))
                                .add(t.getFees());
                        costDenominator = costDenominator.add(t.getQuantity());
                        LocalDate d = t.getExecutedAt().toLocalDate();
                        if (firstBuy == null || d.isBefore(firstBuy)) firstBuy = d;
                    }
                    case "sell" -> qty = qty.subtract(t.getQuantity());
                    case "split" -> {
                        // 단순화: 분할 비율 정보 부재 시 quantity 직접 가산
                        qty = qty.add(t.getQuantity());
                    }
                    case "dividend" -> { /* quantity 변동 없음 */ }
                    default -> { /* fee/deposit/withdrawal — 잔고 재계산에 미반영 */ }
                }
            }

            if (qty.signum() <= 0) continue;
            BigDecimal avgCost = costDenominator.signum() > 0
                    ? costNumerator.divide(costDenominator, 8, java.math.RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            result.add(PositionEntity.builder()
                    .id(UUID.randomUUID())
                    .assetId(assetId)
                    .assetName(assetId)
                    .assetClass("equity") // 거래내역에는 asset_class 부재 → 기본 추정
                    .quantity(qty)
                    .avgCost(avgCost)
                    .weight(BigDecimal.ZERO)
                    .acquiredAt(firstBuy)
                    .build());
        }
        // weight 재계산
        BigDecimal total = result.stream()
                .map(p -> p.getAvgCost().multiply(p.getQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (total.signum() > 0) {
            for (PositionEntity p : result) {
                p.setWeight(p.getAvgCost().multiply(p.getQuantity())
                        .divide(total, 6, java.math.RoundingMode.HALF_UP));
            }
        }
        return result;
    }

    // ─────────────────── 유틸 ───────────────────

    private static String safeGet(CSVRecord r, Integer idx) {
        if (idx == null || idx < 0 || idx >= r.size()) return null;
        String v = r.get(idx);
        return v == null ? null : v.trim();
    }

    private static String normalizeSide(String s) {
        if (s == null) return "buy";
        return switch (s.trim().toLowerCase(Locale.ROOT)) {
            case "buy", "매수", "b" -> "buy";
            case "sell", "매도", "s" -> "sell";
            case "dividend", "배당", "div" -> "dividend";
            case "split", "분할" -> "split";
            case "fee", "수수료" -> "fee";
            case "deposit", "입금" -> "deposit";
            case "withdrawal", "출금" -> "withdrawal";
            default -> "buy";
        };
    }

    private static String normalizeAssetClass(String s) {
        if (s == null) return "equity";
        String v = s.trim().toLowerCase(Locale.ROOT);
        return switch (v) {
            case "equity", "stock", "주식" -> "equity";
            case "etf" -> "etf";
            case "fund", "펀드" -> "fund";
            case "bond", "채권" -> "bond";
            case "crypto", "암호자산", "암호화폐", "코인" -> "crypto";
            case "commodity", "원자재", "상품" -> "commodity";
            default -> "equity";
        };
    }

    private static BigDecimal parseDecimalSafe(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return new BigDecimal(s.replaceAll("[,_\\s]", ""));
        } catch (Exception e) {
            return null;
        }
    }

    private static LocalDate parseLocalDateSafe(String s) {
        if (s == null || s.isBlank()) return null;
        s = s.trim();
        List<DateTimeFormatter> fmts = List.of(
                DateTimeFormatter.ISO_LOCAL_DATE,
                DateTimeFormatter.ofPattern("yyyy/MM/dd"),
                DateTimeFormatter.ofPattern("yyyy.MM.dd"),
                DateTimeFormatter.ofPattern("yyyyMMdd")
        );
        for (DateTimeFormatter f : fmts) {
            try { return LocalDate.parse(s, f); }
            catch (DateTimeParseException ignored) {}
        }
        try {
            return OffsetDateTime.parse(s).toLocalDate();
        } catch (DateTimeParseException ignored) {}
        return null;
    }

    private static OffsetDateTime parseOffsetDateTimeSafe(String s) {
        if (s == null || s.isBlank()) return null;
        s = s.trim();
        try { return OffsetDateTime.parse(s); }
        catch (DateTimeParseException ignored) {}
        try {
            return LocalDate.parse(s).atStartOfDay().atOffset(ZoneOffset.UTC);
        } catch (DateTimeParseException ignored) {}
        return null;
    }

    private static String upper(String s) {
        return s == null ? null : s.toUpperCase(Locale.ROOT);
    }

    public enum InputKind { HOLDINGS, TRANSACTIONS }

    public record ParsedCsv(
            InputKind kind,
            List<PositionEntity> positions,
            List<TransactionEntity> transactions,
            List<String> warnings
    ) {}
}
