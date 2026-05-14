package com.omnidash.controller;

import com.omnidash.service.skills.SkillsConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Skills 임계값 핫리로드 — 시연 3 시현용.
 * POST /api/skills/reload 호출 시 SKILLS_CONFIG_PATH 디렉토리의 thresholds.yml을 재로드한다.
 */
@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillsController {

    private final SkillsConfig skillsConfig;

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> get() {
        return ResponseEntity.ok(skillsConfig.get());
    }

    @PostMapping("/reload")
    public ResponseEntity<Map<String, Object>> reload() {
        Map<String, Object> cfg = skillsConfig.reload();
        return ResponseEntity.ok(Map.of(
                "version", skillsConfig.version(),
                "loadedAt", skillsConfig.lastLoadedMillis(),
                "config", cfg
        ));
    }
}
