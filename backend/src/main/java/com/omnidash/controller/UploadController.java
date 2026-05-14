package com.omnidash.controller;

import com.omnidash.domain.entity.PortfolioEntity;
import com.omnidash.domain.repository.PositionRepository;
import com.omnidash.dto.UploadRequest;
import com.omnidash.dto.UploadResponse;
import com.omnidash.exception.ApiException;
import com.omnidash.service.PortfolioService;
import com.omnidash.service.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UploadController {

    private final PortfolioService portfolioService;
    private final SessionService sessionService;
    private final PositionRepository positionRepo;

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<UploadResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "baseCurrency", required = false) String baseCurrency,
            @RequestParam(value = "riskProfile", required = false) String riskProfile,
            @RequestParam(value = "audience", required = false) String audience,
            @RequestParam(value = "locale", required = false) String locale,
            @RequestParam(value = "mode", required = false) String mode,
            HttpServletRequest req,
            HttpServletResponse resp) throws IOException {

        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("CSV 파일이 비어 있습니다.");
        }
        UUID sessionId = sessionService.resolveOrCreate(req, resp);
        UploadRequest cfg = new UploadRequest(baseCurrency, riskProfile, audience, locale, mode);

        PortfolioEntity portfolio = portfolioService.uploadCsv(sessionId, file, cfg);
        int rowCount = positionRepo.findByPortfolioId(portfolio.getId()).size();
        List<String> warnings = portfolio.getWarnings() == null
                ? List.of()
                : Arrays.stream(portfolio.getWarnings().split("\\|\\|")).toList();

        return ResponseEntity.ok(new UploadResponse(
                portfolio.getId(),
                portfolio.getName(),
                portfolio.getSource(),
                rowCount,
                warnings
        ));
    }
}
