package com.tretto.card;

import com.tretto.board.Board;
import com.tretto.card.dto.CardMoveRequest;
import com.tretto.card.dto.CardRequest;
import com.tretto.card.dto.CardResponse;
import com.tretto.column.BoardColumn;
import com.tretto.column.ColumnRepository;
import com.tretto.label.LabelRepository;
import com.tretto.member.BoardAccessEvaluator;
import com.tretto.member.Role;
import com.tretto.user.User;
import com.tretto.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CardServiceTest {

    @Mock
    private CardRepository cardRepository;

    @Mock
    private ColumnRepository columnRepository;

    @Mock
    private LabelRepository labelRepository;

    @Mock
    private BoardAccessEvaluator boardAccessEvaluator;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CardService cardService;

    private User user;
    private UUID userId;
    private Board board;
    private UUID boardId;
    private BoardColumn column;
    private UUID columnId;
    private Card card;
    private UUID cardId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = User.builder()
                .id(userId)
                .email("user@example.com")
                .displayName("User")
                .passwordHash("hash")
                .createdAt(LocalDateTime.now())
                .build();

        boardId = UUID.randomUUID();
        board = Board.builder()
                .id(boardId)
                .title("Board")
                .owner(user)
                .columns(new ArrayList<>())
                .members(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .build();

        columnId = UUID.randomUUID();
        column = BoardColumn.builder()
                .id(columnId)
                .board(board)
                .title("Column")
                .position(0)
                .cards(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .build();

        cardId = UUID.randomUUID();
        card = Card.builder()
                .id(cardId)
                .column(column)
                .board(board)
                .title("Card")
                .position(0)
                .labels(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void moveCard_withinColumn_updatesPosition() {
        CardMoveRequest request = new CardMoveRequest();
        request.setColumnId(columnId);
        request.setPosition(2);

        when(cardRepository.findById(cardId)).thenReturn(Optional.of(card));
        when(cardRepository.countByColumnId(columnId)).thenReturn(5);
        when(cardRepository.save(any(Card.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(boardAccessEvaluator).requireRole(boardId, userId, Role.EDITOR);
        doNothing().when(cardRepository).decrementPositionsAfter(columnId, 0);
        doNothing().when(cardRepository).incrementPositionsFrom(columnId, 2);

        CardResponse response = cardService.moveCard(cardId, request, userId);

        assertThat(response.getPosition()).isEqualTo(2);
        verify(cardRepository).decrementPositionsAfter(columnId, 0);
        verify(cardRepository).incrementPositionsFrom(columnId, 2);
    }

    @Test
    void moveCard_betweenColumns_updatesColumnAndPosition() {
        UUID newColumnId = UUID.randomUUID();
        BoardColumn newColumn = BoardColumn.builder()
                .id(newColumnId)
                .board(board)
                .title("New Column")
                .position(1)
                .cards(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .build();

        CardMoveRequest request = new CardMoveRequest();
        request.setColumnId(newColumnId);
        request.setPosition(0);

        when(cardRepository.findById(cardId)).thenReturn(Optional.of(card));
        when(columnRepository.findById(newColumnId)).thenReturn(Optional.of(newColumn));
        when(cardRepository.countByColumnId(newColumnId)).thenReturn(3);
        when(cardRepository.save(any(Card.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(boardAccessEvaluator).requireRole(boardId, userId, Role.EDITOR);
        doNothing().when(cardRepository).decrementPositionsAfter(columnId, 0);
        doNothing().when(cardRepository).incrementPositionsFrom(newColumnId, 0);

        CardResponse response = cardService.moveCard(cardId, request, userId);

        assertThat(response.getColumnId()).isEqualTo(newColumnId);
        assertThat(response.getPosition()).isEqualTo(0);
        verify(cardRepository).decrementPositionsAfter(columnId, 0);
        verify(cardRepository).incrementPositionsFrom(newColumnId, 0);
    }

    @Test
    void moveCard_unauthorizedUser_throwsAccessDeniedException() {
        UUID unauthorizedUserId = UUID.randomUUID();
        CardMoveRequest request = new CardMoveRequest();
        request.setColumnId(columnId);
        request.setPosition(1);

        when(cardRepository.findById(cardId)).thenReturn(Optional.of(card));
        doThrow(new AccessDeniedException("Insufficient board permissions"))
                .when(boardAccessEvaluator).requireRole(boardId, unauthorizedUserId, Role.EDITOR);

        assertThatThrownBy(() -> cardService.moveCard(cardId, request, unauthorizedUserId))
                .isInstanceOf(AccessDeniedException.class);
    }
}
