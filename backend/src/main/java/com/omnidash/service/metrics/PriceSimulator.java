package com.omnidash.service.metrics;

import com.omnidash.service.skills.SkillsConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Random;

/**
 * 결정적 합성 가격 시계열 생성기 (Geometric Brownian Motion).
 *
 * 해커톤 규칙상 외부 키 없이 심사자가 확인 가능해야 하므로(개요.md), 실데이터 API 대신
 * asset_id를 시드로 한 재현 가능한 random walk 시계열을 사용한다.
 *
 *   dS/S = μ·dt + σ·dW
 *   S_t = S_{t-1} · exp((μ - σ²/2)·dt + σ·√dt·z)
 *
 * 결과는 (period 일수) × (자산 수) 행렬. 마지막 가격이 인덱스 last.
 */
@Component
@RequiredArgsConstructor
public class PriceSimulator {

    private final SkillsConfig skills;

    public double[] simulate(String assetId, String assetClass, double startPrice) {
        Map<String, Object> sim = skills.simulation(assetClass);
        double mu = numOrDefault(sim.get("mu"), 0.08);
        double sigma = numOrDefault(sim.get("sigma"), 0.20);
        int n = skills.simulationTradingDays();

        Random rng = new Random(stableSeed(assetId));
        double dt = 1.0 / 252.0;
        double sqrtDt = Math.sqrt(dt);
        double drift = (mu - 0.5 * sigma * sigma) * dt;
        double diffusion = sigma * sqrtDt;

        double[] prices = new double[n];
        prices[0] = startPrice;
        for (int i = 1; i < n; i++) {
            double z = rng.nextGaussian();
            prices[i] = prices[i - 1] * Math.exp(drift + diffusion * z);
        }
        return prices;
    }

    public double[] simulateBenchmark(String benchmarkId) {
        // 벤치마크는 통상 분산 잘 된 등락 → 낮은 σ
        Random rng = new Random(stableSeed("BENCH::" + benchmarkId));
        int n = skills.simulationTradingDays();
        double mu = 0.08, sigma = 0.15;
        double dt = 1.0 / 252.0;
        double drift = (mu - 0.5 * sigma * sigma) * dt;
        double diffusion = sigma * Math.sqrt(dt);
        double[] s = new double[n];
        s[0] = 100.0;
        for (int i = 1; i < n; i++) {
            s[i] = s[i - 1] * Math.exp(drift + diffusion * rng.nextGaussian());
        }
        return s;
    }

    private static long stableSeed(String s) {
        long h = 1469598103934665603L;
        for (int i = 0; i < s.length(); i++) {
            h ^= s.charAt(i);
            h *= 1099511628211L;
        }
        return h;
    }

    private static double numOrDefault(Object v, double d) {
        return v instanceof Number n ? n.doubleValue() : d;
    }
}
