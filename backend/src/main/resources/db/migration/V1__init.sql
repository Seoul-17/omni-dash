-- Omni-Dash 익명 세션 + 포트폴리오 영속화
CREATE TABLE sessions (
    id          UUID PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL
);

CREATE TABLE portfolios (
    id              UUID PRIMARY KEY,
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    source          TEXT NOT NULL,                  -- holdings | transactions | merged
    base_currency   TEXT NOT NULL DEFAULT 'KRW',
    risk_profile    TEXT NOT NULL DEFAULT 'moderate',
    audience        TEXT NOT NULL DEFAULT 'intermediate',
    locale          TEXT NOT NULL DEFAULT 'ko-KR',
    raw_filename    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    warnings        TEXT
);
CREATE INDEX idx_portfolios_session ON portfolios(session_id);

CREATE TABLE positions (
    id              UUID PRIMARY KEY,
    portfolio_id    UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    asset_id        TEXT NOT NULL,
    asset_name      TEXT,
    asset_class     TEXT NOT NULL,                  -- equity|etf|fund|bond|crypto|commodity
    sector          TEXT,
    quantity        NUMERIC(20, 8) NOT NULL,
    avg_cost        NUMERIC(20, 8) NOT NULL,
    weight          NUMERIC(10, 6) NOT NULL,
    base_currency   TEXT,
    acquired_at     DATE
);
CREATE INDEX idx_positions_portfolio ON positions(portfolio_id);

CREATE TABLE transactions (
    id              UUID PRIMARY KEY,
    portfolio_id    UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    transaction_id  TEXT,
    asset_id        TEXT NOT NULL,
    side            TEXT NOT NULL,                  -- buy|sell|dividend|split|fee|deposit|withdrawal
    quantity        NUMERIC(20, 8) NOT NULL,
    price           NUMERIC(20, 8) NOT NULL,
    fees            NUMERIC(20, 8) NOT NULL DEFAULT 0,
    executed_at     TIMESTAMPTZ NOT NULL,
    tax_treatment   TEXT NOT NULL DEFAULT 'pre_tax'
);
CREATE INDEX idx_transactions_portfolio ON transactions(portfolio_id);

-- 캐시(Skills 05 §6.3): 동일 cache_key 결과 재사용
CREATE TABLE dashboard_cache (
    cache_key      TEXT PRIMARY KEY,
    portfolio_id   UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    skill_version  TEXT NOT NULL,
    payload        TEXT NOT NULL,   -- 캐시된 DashboardOutput JSON 직렬화
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cache_portfolio ON dashboard_cache(portfolio_id);
