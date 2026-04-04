package com.tretto.card;

import com.tretto.board.Board;
import com.tretto.card.dto.CardMoveRequest;
import com.tretto.card.dto.CardRequest;
import com.tretto.card.dto.CardResponse;
import com.tretto.column.BoardColumn;
import com.tretto.column.ColumnRepository;
import com.tretto.exception.TrettoException;
import com.tretto.label.Label;
import com.tretto.label.LabelRepository;
import com.tretto.member.BoardAccessEvaluator;
import com.tretto.member.Role;
import com.tretto.user.User;
import com.tretto.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CardService {

    private final CardRepository cardRepository;
    private final ColumnRepository columnRepository;
    private final LabelRepository labelRepository;
    private final BoardAccessEvaluator boardAccessEvaluator;
    private final UserRepository userRepository;

    @Transactional
    public CardResponse createCard(UUID columnId, CardRequest request, UUID userId) {
        BoardColumn column = findColumnById(columnId);
        boardAccessEvaluator.requireRole(column.getBoard().getId(), userId, Role.EDITOR);

        int position = cardRepository.countByColumnId(columnId);

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId()).orElse(null);
        }

        Card card = Card.builder()
                .column(column)
                .board(column.getBoard())
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .assignee(assignee)
                .position(position)
                .build();
        card = cardRepository.save(card);
        return toResponse(card);
    }

    @Transactional(readOnly = true)
    public CardResponse getCard(UUID cardId, UUID userId) {
        Card card = findCardById(cardId);
        boardAccessEvaluator.requireRole(card.getBoard().getId(), userId, Role.VIEWER);
        return toResponse(card);
    }

    @Transactional
    public CardResponse updateCard(UUID cardId, CardRequest request, UUID userId) {
        Card card = findCardById(cardId);
        boardAccessEvaluator.requireRole(card.getBoard().getId(), userId, Role.EDITOR);

        if (request.getTitle() != null) card.setTitle(request.getTitle());
        if (request.getDescription() != null) card.setDescription(request.getDescription());
        if (request.getDueDate() != null) card.setDueDate(request.getDueDate());
        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId()).orElse(null);
            card.setAssignee(assignee);
        }

        card = cardRepository.save(card);
        return toResponse(card);
    }

    @Transactional
    public CardResponse moveCard(UUID cardId, CardMoveRequest request, UUID userId) {
        Card card = findCardById(cardId);
        UUID oldColumnId = card.getColumn().getId();
        UUID newColumnId = request.getColumnId() != null ? request.getColumnId() : oldColumnId;
        int newPosition = request.getPosition();

        boardAccessEvaluator.requireRole(card.getBoard().getId(), userId, Role.EDITOR);

        // Decrement positions in old column after old position
        cardRepository.decrementPositionsAfter(oldColumnId, card.getPosition());

        if (!oldColumnId.equals(newColumnId)) {
            BoardColumn newColumn = findColumnById(newColumnId);
            int maxNew = cardRepository.countByColumnId(newColumnId);
            newPosition = Math.max(0, Math.min(newPosition, maxNew));
            cardRepository.incrementPositionsFrom(newColumnId, newPosition);
            card.setColumn(newColumn);
        } else {
            int maxPos = cardRepository.countByColumnId(oldColumnId) - 1;
            newPosition = Math.max(0, Math.min(newPosition, maxPos));
            cardRepository.incrementPositionsFrom(oldColumnId, newPosition);
        }

        card.setPosition(newPosition);
        card = cardRepository.save(card);
        return toResponse(card);
    }

    @Transactional
    public void deleteCard(UUID cardId, UUID userId) {
        Card card = findCardById(cardId);
        boardAccessEvaluator.requireRole(card.getBoard().getId(), userId, Role.EDITOR);
        int position = card.getPosition();
        UUID columnId = card.getColumn().getId();
        cardRepository.delete(card);
        cardRepository.decrementPositionsAfter(columnId, position - 1);
    }

    @Transactional
    public void addLabel(UUID cardId, UUID labelId, UUID userId) {
        Card card = findCardById(cardId);
        boardAccessEvaluator.requireRole(card.getBoard().getId(), userId, Role.EDITOR);
        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new EntityNotFoundException("Label not found: " + labelId));
        if (!card.getLabels().contains(label)) {
            card.getLabels().add(label);
            cardRepository.save(card);
        }
    }

    @Transactional
    public void removeLabel(UUID cardId, UUID labelId, UUID userId) {
        Card card = findCardById(cardId);
        boardAccessEvaluator.requireRole(card.getBoard().getId(), userId, Role.EDITOR);
        card.getLabels().removeIf(l -> l.getId().equals(labelId));
        cardRepository.save(card);
    }

    private Card findCardById(UUID cardId) {
        return cardRepository.findById(cardId)
                .orElseThrow(() -> new EntityNotFoundException("Card not found: " + cardId));
    }

    private BoardColumn findColumnById(UUID columnId) {
        return columnRepository.findById(columnId)
                .orElseThrow(() -> new EntityNotFoundException("Column not found: " + columnId));
    }

    public CardResponse toResponse(Card card) {
        return CardResponse.builder()
                .id(card.getId())
                .columnId(card.getColumn().getId())
                .boardId(card.getBoard().getId())
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
                .build();
    }
}
