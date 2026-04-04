package com.tretto.card.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CardRequest {

    @NotBlank
    private String title;

    private String description;
    private LocalDate dueDate;
    private UUID assigneeId;
}
