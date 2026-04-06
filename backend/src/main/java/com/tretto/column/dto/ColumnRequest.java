package com.tretto.column.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ColumnRequest {

    @NotBlank
    private String title;
}
