package com.tretto.label;

import com.tretto.board.Board;
import com.tretto.board.BoardRepository;
import com.tretto.label.dto.LabelRequest;
import com.tretto.label.dto.LabelResponse;
import com.tretto.member.BoardAccessEvaluator;
import com.tretto.member.Role;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LabelService {

    private final LabelRepository labelRepository;
    private final BoardRepository boardRepository;
    private final BoardAccessEvaluator boardAccessEvaluator;

    @Transactional(readOnly = true)
    public List<LabelResponse> getLabels(UUID boardId, UUID userId) {
        boardAccessEvaluator.requireRole(boardId, userId, Role.VIEWER);
        return labelRepository.findByBoardId(boardId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public LabelResponse createLabel(UUID boardId, LabelRequest request, UUID userId) {
        boardAccessEvaluator.requireRole(boardId, userId, Role.EDITOR);
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board not found: " + boardId));
        Label label = Label.builder()
                .board(board)
                .name(request.getName())
                .color(request.getColor())
                .build();
        label = labelRepository.save(label);
        return toResponse(label);
    }

    @Transactional
    public void deleteLabel(UUID labelId, UUID userId) {
        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new EntityNotFoundException("Label not found: " + labelId));
        boardAccessEvaluator.requireRole(label.getBoard().getId(), userId, Role.EDITOR);
        labelRepository.delete(label);
    }

    private LabelResponse toResponse(Label label) {
        return LabelResponse.builder()
                .id(label.getId())
                .boardId(label.getBoard().getId())
                .name(label.getName())
                .color(label.getColor())
                .build();
    }
}
