package com.tretto.column.dto;

import com.tretto.card.dto.CardResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ColumnResponse {
    private UUID id;
    private UUID boardId;
    private String title;
    private int position;
    private LocalDateTime createdAt;
    private List<CardResponse> cards;
}
