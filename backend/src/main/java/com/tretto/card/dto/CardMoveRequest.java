package com.tretto.card.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class CardMoveRequest {
    private UUID columnId;
    private int position;
}
