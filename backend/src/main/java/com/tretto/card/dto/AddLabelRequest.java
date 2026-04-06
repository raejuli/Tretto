package com.tretto.card.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AddLabelRequest {

    @NotNull
    private UUID labelId;
}
