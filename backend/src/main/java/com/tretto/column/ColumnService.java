package com.tretto.column;

import com.tretto.board.Board;
import com.tretto.board.BoardRepository;
import com.tretto.card.dto.CardResponse;
import com.tretto.column.dto.ColumnRequest;
import com.tretto.column.dto.ColumnResponse;
import com.tretto.exception.TrettoException;
import com.tretto.member.BoardAccessEvaluator;
import com.tretto.member.Role;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ColumnService {

    private final ColumnRepository columnRepository;
    private final BoardRepository boardRepository;
    private final BoardAccessEvaluator boardAccessEvaluator;

    @Transactional
    public ColumnResponse createColumn(UUID boardId, ColumnRequest request, UUID userId) {
        boardAccessEvaluator.requireRole(boardId, userId, Role.EDITOR);
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board not found: " + boardId));

        int position = columnRepository.countByBoardId(boardId);
        BoardColumn column = BoardColumn.builder()
                .board(board)
                .title(request.getTitle())
                .position(position)
                .build();
        column = columnRepository.save(column);
        return toResponse(column);
    }

    @Transactional
    public ColumnResponse renameColumn(UUID columnId, ColumnRequest request, UUID userId) {
        BoardColumn column = findColumnById(columnId);
        boardAccessEvaluator.requireRole(column.getBoard().getId(), userId, Role.EDITOR);
        column.setTitle(request.getTitle());
        column = columnRepository.save(column);
        return toResponse(column);
    }

    @Transactional
    public ColumnResponse moveColumn(UUID columnId, int newPosition, UUID userId) {
        BoardColumn column = findColumnById(columnId);
        UUID boardId = column.getBoard().getId();
        boardAccessEvaluator.requireRole(boardId, userId, Role.EDITOR);

        int oldPosition = column.getPosition();
        int maxPosition = columnRepository.countByBoardId(boardId) - 1;
        newPosition = Math.max(0, Math.min(newPosition, maxPosition));

        if (oldPosition == newPosition) {
            return toResponse(column);
        }

        columnRepository.decrementPositionsAfter(boardId, oldPosition);
        columnRepository.incrementPositionsFrom(boardId, newPosition);
        column.setPosition(newPosition);
        column = columnRepository.save(column);
        return toResponse(column);
    }

    @Transactional
    public void deleteColumn(UUID columnId, UUID userId) {
        BoardColumn column = findColumnById(columnId);
        UUID boardId = column.getBoard().getId();
        boardAccessEvaluator.requireRole(boardId, userId, Role.EDITOR);

        int position = column.getPosition();
        columnRepository.delete(column);
        columnRepository.decrementPositionsAfter(boardId, position - 1);
    }

    private BoardColumn findColumnById(UUID columnId) {
        return columnRepository.findById(columnId)
                .orElseThrow(() -> new EntityNotFoundException("Column not found: " + columnId));
    }

    public ColumnResponse toResponse(BoardColumn column) {
        List<CardResponse> cardResponses = column.getCards() != null
                ? column.getCards().stream().map(card -> CardResponse.builder()
                        .id(card.getId())
                        .columnId(column.getId())
                        .boardId(column.getBoard().getId())
                        .title(card.getTitle())
                        .description(card.getDescription())
                        .position(card.getPosition())
                        .dueDate(card.getDueDate())
                        .assigneeId(card.getAssignee() != null ? card.getAssignee().getId() : null)
                        .assigneeDisplayName(card.getAssignee() != null ? card.getAssignee().getDisplayName() : null)
                        .createdAt(card.getCreatedAt())
                        .updatedAt(card.getUpdatedAt())
                        .labels(card.getLabels() != null ? card.getLabels().stream()
                                .map(l -> CardResponse.LabelInfo.builder()
                                        .id(l.getId())
                                        .name(l.getName())
                                        .color(l.getColor())
                                        .build())
                                .toList() : List.of())
                        .build())
                .toList()
                : List.of();

        return ColumnResponse.builder()
                .id(column.getId())
                .boardId(column.getBoard().getId())
                .title(column.getTitle())
                .position(column.getPosition())
                .createdAt(column.getCreatedAt())
                .cards(cardResponses)
                .build();
    }
}
