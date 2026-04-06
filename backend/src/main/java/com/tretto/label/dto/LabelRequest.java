package com.tretto.label.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LabelRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String color;
}
