package com.omnidash.service.skills;

import com.omnidash.config.OmnidashProperties;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.yaml.snakeyaml.Yaml;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

/**
 * thresholds.yml 로드 + 외부 디렉토리 핫리로드.
 * Skills 05 §6.3 시연 3 "Skills.md 텍스트 수정 → 즉시 반영" 의 백엔드 절반.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SkillsConfig {

    private final OmnidashProperties props;
    private final AtomicReference<Map<String, Object>> cfgRef = new AtomicReference<>(Collections.emptyMap());
    private volatile long lastLoadedMillis = 0L;

    @PostConstruct
    public void init() { reload(); }

    @SuppressWarnings("unchecked")
    public synchronized Map<String, Object> reload() {
        String externalPath = props.getSkills().getConfigPath();
        Map<String, Object> loaded = null;
        if (externalPath != null && !externalPath.isBlank()) {
            Path p = Path.of(externalPath, "thresholds.yml");
            if (Files.exists(p)) {
                try (InputStream in = Files.newInputStream(p)) {
                    loaded = new Yaml().load(in);
                    log.info("Loaded thresholds.yml from external path: {}", p);
                } catch (Exception e) {
                    log.warn("Failed to load external thresholds.yml, fallback to classpath: {}", e.getMessage());
                }
            }
        }
        if (loaded == null) {
            try (InputStream in = new ClassPathResource("skills/thresholds.yml").getInputStream()) {
                loaded = new Yaml().load(in);
                log.info("Loaded thresholds.yml from classpath");
            } catch (Exception e) {
                throw new IllegalStateException("Cannot load default thresholds.yml", e);
            }
        }
        cfgRef.set(loaded == null ? Collections.emptyMap() : loaded);
        lastLoadedMillis = System.currentTimeMillis();
        return cfgRef.get();
    }

    public Map<String, Object> get() { return cfgRef.get(); }

    @SuppressWarnings("unchecked")
    public Map<String, Object> assetClass(String cls) {
        Map<String, Object> ac = (Map<String, Object>) cfgRef.get().get("asset_classes");
        if (ac == null) return Collections.emptyMap();
        Map<String, Object> v = (Map<String, Object>) ac.get(cls);
        return v == null ? Collections.emptyMap() : v;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> simulation(String cls) {
        Map<String, Object> sim = (Map<String, Object>) cfgRef.get().get("simulation");
        if (sim == null) return Collections.emptyMap();
        Object v = sim.get(cls);
        if (v instanceof Map) return (Map<String, Object>) v;
        return Collections.emptyMap();
    }

    public int simulationTradingDays() {
        Object v = ((Map<String, Object>) cfgRef.get().getOrDefault("simulation", Map.of())).get("trading_days");
        if (v instanceof Number n) return n.intValue();
        return 320;
    }

    @SuppressWarnings("unchecked")
    public double parameter(String key, double fallback) {
        Map<String, Object> p = (Map<String, Object>) cfgRef.get().get("parameters");
        if (p == null) return fallback;
        Object v = p.get(key);
        return v instanceof Number n ? n.doubleValue() : fallback;
    }

    @SuppressWarnings("unchecked")
    public double riskProfileAdjust(String profile) {
        Map<String, Object> p = (Map<String, Object>) cfgRef.get().get("risk_profile_adjust");
        if (p == null) return 0.0;
        Object v = p.get(profile);
        return v instanceof Number n ? n.doubleValue() : 0.0;
    }

    @SuppressWarnings("unchecked")
    public String benchmark(String currency) {
        Map<String, Object> b = (Map<String, Object>) cfgRef.get().get("benchmark_default");
        if (b == null) return "ACWI";
        return (String) b.getOrDefault(currency, b.getOrDefault("default", "ACWI"));
    }

    public String version() {
        Object v = cfgRef.get().get("version");
        return v == null ? "3.0.0" : v.toString();
    }

    public long lastLoadedMillis() { return lastLoadedMillis; }
}
