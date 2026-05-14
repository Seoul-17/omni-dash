package com.omnidash.service;

import com.omnidash.domain.entity.PortfolioEntity;
import com.omnidash.domain.entity.PositionEntity;
import com.omnidash.domain.entity.TransactionEntity;
import com.omnidash.domain.repository.PortfolioRepository;
import com.omnidash.domain.repository.PositionRepository;
import com.omnidash.domain.repository.TransactionRepository;
import com.omnidash.dto.UploadRequest;
import com.omnidash.service.csv.CsvParserService;
import com.omnidash.service.csv.CsvParserService.ParsedCsv;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final PortfolioRepository portfolioRepo;
    private final PositionRepository positionRepo;
    private final TransactionRepository transactionRepo;
    private final CsvParserService csvParser;

    @Transactional
    public PortfolioEntity uploadCsv(UUID sessionId, MultipartFile file, UploadRequest request) throws IOException {
        UploadRequest cfg = request == null ? new UploadRequest(null, null, null, null, null) : request;
        cfg = cfg.withDefaults();

        ParsedCsv parsed;
        try (var in = file.getInputStream()) {
            parsed = csvParser.parse(in);
        }

        UUID portfolioId = UUID.randomUUID();
        PortfolioEntity portfolio = PortfolioEntity.builder()
                .id(portfolioId)
                .sessionId(sessionId)
                .name(displayName(file.getOriginalFilename()))
                .source(parsed.kind() == CsvParserService.InputKind.TRANSACTIONS ? "transactions" : "holdings")
                .baseCurrency(cfg.baseCurrency())
                .riskProfile(cfg.riskProfile())
                .audience(cfg.audience())
                .locale(cfg.locale())
                .rawFilename(file.getOriginalFilename())
                .createdAt(OffsetDateTime.now(ZoneOffset.UTC))
                .warnings(parsed.warnings().isEmpty() ? null : String.join("||", parsed.warnings()))
                .build();
        portfolioRepo.save(portfolio);

        for (PositionEntity p : parsed.positions()) p.setPortfolioId(portfolioId);
        positionRepo.saveAll(parsed.positions());

        if (!parsed.transactions().isEmpty()) {
            for (TransactionEntity t : parsed.transactions()) t.setPortfolioId(portfolioId);
            transactionRepo.saveAll(parsed.transactions());
        }

        log.info("Uploaded portfolio {} ({} positions) for session {}",
                portfolioId, parsed.positions().size(), sessionId);
        return portfolio;
    }

    public List<PortfolioEntity> listForSession(UUID sessionId) {
        return portfolioRepo.findBySessionIdOrderByCreatedAtDesc(sessionId);
    }

    private String displayName(String filename) {
        if (filename == null || filename.isBlank()) return "Portfolio";
        int dot = filename.lastIndexOf('.');
        return dot > 0 ? filename.substring(0, dot) : filename;
    }
}
