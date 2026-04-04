package com.tretto.column;

import com.tretto.column.dto.ColumnMoveRequest;
import com.tretto.column.dto.ColumnRequest;
import com.tretto.column.dto.ColumnResponse;
import com.tretto.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ColumnController {

    private final ColumnService columnService;

    @PostMapping("/api/v1/boards/{boardId}/columns")
    public ResponseEntity<ColumnResponse> createColumn(
            @PathVariable UUID boardId,
            @Valid @RequestBody ColumnRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(columnService.createColumn(boardId, request, user.getId()));
    }

    @PatchMapping("/api/v1/columns/{columnId}")
    public ResponseEntity<ColumnResponse> renameColumn(
            @PathVariable UUID columnId,
            @Valid @RequestBody ColumnRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(columnService.renameColumn(columnId, request, user.getId()));
    }

    @PatchMapping("/api/v1/columns/{columnId}/move")
    public ResponseEntity<ColumnResponse> moveColumn(
            @PathVariable UUID columnId,
            @RequestBody ColumnMoveRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(columnService.moveColumn(columnId, request.getPosition(), user.getId()));
    }

    @DeleteMapping("/api/v1/columns/{columnId}")
    public ResponseEntity<Void> deleteColumn(
            @PathVariable UUID columnId,
            @AuthenticationPrincipal User user
    ) {
        columnService.deleteColumn(columnId, user.getId());
        return ResponseEntity.noContent().build();
    }
}
