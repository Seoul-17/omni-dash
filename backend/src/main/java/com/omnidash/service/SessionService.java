package com.omnidash.service;

import com.omnidash.config.OmnidashProperties;
import com.omnidash.domain.entity.SessionEntity;
import com.omnidash.domain.repository.SessionRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository repo;
    private final OmnidashProperties props;

    /** 쿠키에 세션 ID가 있으면 재사용, 없으면 발급 + 쿠키 세팅. */
    @Transactional
    public UUID resolveOrCreate(HttpServletRequest req, HttpServletResponse resp) {
        UUID existing = readSessionId(req);
        if (existing != null) {
            return repo.findById(existing)
                    .filter(s -> s.getExpiresAt().isAfter(OffsetDateTime.now(ZoneOffset.UTC)))
                    .map(SessionEntity::getId)
                    .orElseGet(() -> create(resp));
        }
        return create(resp);
    }

    public UUID requireSessionId(HttpServletRequest req) {
        UUID id = readSessionId(req);
        if (id == null) throw com.omnidash.exception.ApiException.badRequest("세션 쿠키가 없습니다. 먼저 업로드하세요.");
        return id;
    }

    private UUID readSessionId(HttpServletRequest req) {
        if (req.getCookies() == null) return null;
        String name = props.getSession().getCookieName();
        for (Cookie c : req.getCookies()) {
            if (name.equals(c.getName())) {
                try { return UUID.fromString(c.getValue()); }
                catch (IllegalArgumentException ignored) { return null; }
            }
        }
        return null;
    }

    private UUID create(HttpServletResponse resp) {
        long ttl = props.getSession().getTtlSeconds();
        UUID id = UUID.randomUUID();
        repo.save(SessionEntity.builder()
                .id(id)
                .createdAt(OffsetDateTime.now(ZoneOffset.UTC))
                .expiresAt(OffsetDateTime.now(ZoneOffset.UTC).plusSeconds(ttl))
                .build());

        Cookie cookie = new Cookie(props.getSession().getCookieName(), id.toString());
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge((int) ttl);
        // SameSite=Lax via header (Servlet API doesn't support setSameSite directly)
        resp.addHeader("Set-Cookie", String.format(
                "%s=%s; Max-Age=%d; Path=/; HttpOnly; SameSite=Lax",
                props.getSession().getCookieName(), id, ttl));
        return id;
    }
}
