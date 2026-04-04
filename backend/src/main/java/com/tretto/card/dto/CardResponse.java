package com.tretto.card.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardResponse {
    private UUID id;
    private UUID columnId;
    private UUID boardId;
    private String title;
    private String description;
    private int position;
    private LocalDate dueDate;
    private UUID assigneeId;
    private String assigneeDisplayName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<LabelInfo> labels;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LabelInfo {
        private UUID id;
        private String name;
        private String color;
    }
}
