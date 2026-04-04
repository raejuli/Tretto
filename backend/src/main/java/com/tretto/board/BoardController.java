package com.tretto.board;

import com.tretto.board.dto.BoardDetailResponse;
import com.tretto.board.dto.BoardRequest;
import com.tretto.board.dto.BoardSummaryResponse;
import com.tretto.member.Role;
import com.tretto.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @GetMapping
    public ResponseEntity<List<BoardSummaryResponse>> getBoards(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(boardService.getBoards(user.getId()));
    }

    @PostMapping
    public ResponseEntity<BoardDetailResponse> createBoard(
            @Valid @RequestBody BoardRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(boardService.createBoard(request, user));
    }

    @GetMapping("/{boardId}")
    public ResponseEntity<BoardDetailResponse> getBoard(
            @PathVariable UUID boardId,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(boardService.getBoard(boardId, user.getId()));
    }

    @PatchMapping("/{boardId}")
    public ResponseEntity<BoardDetailResponse> updateBoard(
            @PathVariable UUID boardId,
            @RequestBody BoardRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(boardService.updateBoard(boardId, request, user.getId()));
    }

    @DeleteMapping("/{boardId}")
    public ResponseEntity<Void> deleteBoard(
            @PathVariable UUID boardId,
            @AuthenticationPrincipal User user
    ) {
        boardService.deleteBoard(boardId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{boardId}/members")
    public ResponseEntity<Void> addMember(
            @PathVariable UUID boardId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user
    ) {
        String email = body.get("email");
        Role role = Role.valueOf(body.getOrDefault("role", "VIEWER").toUpperCase());
        boardService.addMember(boardId, email, role, user.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{boardId}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID boardId,
            @PathVariable UUID userId,
            @AuthenticationPrincipal User currentUser
    ) {
        boardService.removeMember(boardId, userId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
