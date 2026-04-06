package com.tretto.board.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardSummaryResponse {
    private UUID id;
    private String title;
    private String description;
    private UUID ownerId;
    private String ownerDisplayName;
    private LocalDateTime createdAt;
    private boolean archived;
    private int columnCount;
}
