package com.omnidash.csv;

import com.omnidash.service.csv.ColumnMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ColumnMapperTest {

    @Test
    void mapsKoreanHeaders() {
        var m = ColumnMapper.resolve(List.of("종목코드", "종목명", "자산구분", "섹터", "수량", "평단가", "통화", "매수일"));
        assertEquals(0, m.idx("asset_id"));
        assertEquals(1, m.idx("asset_name"));
        assertEquals(2, m.idx("asset_class"));
        assertEquals(4, m.idx("quantity"));
        assertEquals(5, m.idx("avg_cost"));
    }

    @Test
    void mapsEnglishHeaders() {
        var m = ColumnMapper.resolve(List.of("asset_id", "asset_name", "asset_class", "sector", "quantity", "avg_cost", "base_currency", "acquired_at"));
        assertEquals(0, m.idx("asset_id"));
        assertEquals(6, m.idx("base_currency"));
        assertEquals(7, m.idx("acquired_at"));
    }

    @Test
    void mapsMessyHeaders() {
        var m = ColumnMapper.resolve(List.of("티커", "종목", "분류", "보유수량", "매입가", "거래일"));
        assertEquals(0, m.idx("asset_id"));
        assertEquals(1, m.idx("asset_name"));
        assertEquals(2, m.idx("asset_class"));
        assertEquals(3, m.idx("quantity"));
        assertEquals(4, m.idx("avg_cost"));
        assertEquals(5, m.idx("executed_at"));
    }
}
