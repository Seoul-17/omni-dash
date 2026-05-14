package com.omnidash.dto;

import java.util.List;
import java.util.UUID;

public record UploadResponse(
        UUID portfolioId,
        String name,
        String source,
        int rowCount,
        List<String> warnings
) {}
