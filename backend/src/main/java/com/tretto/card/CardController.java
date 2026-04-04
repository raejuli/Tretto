package com.tretto.card;

import com.tretto.card.dto.CardMoveRequest;
import com.tretto.card.dto.CardRequest;
import com.tretto.card.dto.CardResponse;
import com.tretto.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;

    @PostMapping("/api/v1/columns/{columnId}/cards")
    public ResponseEntity<CardResponse> createCard(
            @PathVariable UUID columnId,
            @Valid @RequestBody CardRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cardService.createCard(columnId, request, user.getId()));
    }

    @GetMapping("/api/v1/cards/{cardId}")
    public ResponseEntity<CardResponse> getCard(
            @PathVariable UUID cardId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(cardService.getCard(cardId, user.getId()));
    }

    @PatchMapping("/api/v1/cards/{cardId}")
    public ResponseEntity<CardResponse> updateCard(
            @PathVariable UUID cardId,
            @RequestBody CardRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(cardService.updateCard(cardId, request, user.getId()));
    }

    @PatchMapping("/api/v1/cards/{cardId}/move")
    public ResponseEntity<CardResponse> moveCard(
            @PathVariable UUID cardId,
            @RequestBody CardMoveRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(cardService.moveCard(cardId, request, user.getId()));
    }

    @DeleteMapping("/api/v1/cards/{cardId}")
    public ResponseEntity<Void> deleteCard(
            @PathVariable UUID cardId,
            @AuthenticationPrincipal User user
    ) {
        cardService.deleteCard(cardId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/v1/cards/{cardId}/labels")
    public ResponseEntity<Void> addLabel(
            @PathVariable UUID cardId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user
    ) {
        UUID labelId = UUID.fromString(body.get("labelId"));
        cardService.addLabel(cardId, labelId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/api/v1/cards/{cardId}/labels/{labelId}")
    public ResponseEntity<Void> removeLabel(
            @PathVariable UUID cardId,
            @PathVariable UUID labelId,
            @AuthenticationPrincipal User user
    ) {
        cardService.removeLabel(cardId, labelId, user.getId());
        return ResponseEntity.noContent().build();
    }
}
