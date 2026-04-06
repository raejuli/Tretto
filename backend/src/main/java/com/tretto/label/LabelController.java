package com.tretto.label;

import com.tretto.label.dto.LabelRequest;
import com.tretto.label.dto.LabelResponse;
import com.tretto.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class LabelController {

    private final LabelService labelService;

    @GetMapping("/api/v1/boards/{boardId}/labels")
    public ResponseEntity<List<LabelResponse>> getLabels(
            @PathVariable UUID boardId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(labelService.getLabels(boardId, user.getId()));
    }

    @PostMapping("/api/v1/boards/{boardId}/labels")
    public ResponseEntity<LabelResponse> createLabel(
            @PathVariable UUID boardId,
            @Valid @RequestBody LabelRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(labelService.createLabel(boardId, request, user.getId()));
    }

    @DeleteMapping("/api/v1/labels/{labelId}")
    public ResponseEntity<Void> deleteLabel(
            @PathVariable UUID labelId,
            @AuthenticationPrincipal User user
    ) {
        labelService.deleteLabel(labelId, user.getId());
        return ResponseEntity.noContent().build();
    }
}
