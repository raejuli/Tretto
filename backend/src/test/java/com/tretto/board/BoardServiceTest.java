package com.tretto.board;

import com.tretto.board.dto.BoardRequest;
import com.tretto.board.dto.BoardDetailResponse;
import com.tretto.member.BoardAccessEvaluator;
import com.tretto.member.BoardMember;
import com.tretto.member.BoardMemberId;
import com.tretto.member.BoardMemberRepository;
import com.tretto.member.Role;
import com.tretto.user.User;
import com.tretto.user.UserService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BoardServiceTest {

    @Mock
    private BoardRepository boardRepository;

    @Mock
    private BoardMemberRepository boardMemberRepository;

    @Mock
    private BoardAccessEvaluator boardAccessEvaluator;

    @Mock
    private UserService userService;

    @InjectMocks
    private BoardService boardService;

    private User owner;
    private UUID ownerId;

    @BeforeEach
    void setUp() {
        ownerId = UUID.randomUUID();
        owner = User.builder()
                .id(ownerId)
                .email("owner@example.com")
                .displayName("Owner")
                .passwordHash("hash")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createBoard_addsOwnerAsMember() {
        BoardRequest request = new BoardRequest();
        request.setTitle("Test Board");
        request.setDescription("Desc");

        UUID boardId = UUID.randomUUID();
        Board savedBoard = Board.builder()
                .id(boardId)
                .title("Test Board")
                .description("Desc")
                .owner(owner)
                .columns(new ArrayList<>())
                .members(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .build();

        when(boardRepository.save(any(Board.class))).thenReturn(savedBoard);
        when(boardMemberRepository.save(any(BoardMember.class))).thenAnswer(inv -> inv.getArgument(0));

        BoardDetailResponse response = boardService.createBoard(request, owner);

        assertThat(response.getId()).isEqualTo(boardId);
        assertThat(response.getTitle()).isEqualTo("Test Board");

        ArgumentCaptor<BoardMember> memberCaptor = ArgumentCaptor.forClass(BoardMember.class);
        verify(boardMemberRepository).save(memberCaptor.capture());
        BoardMember savedMember = memberCaptor.getValue();
        assertThat(savedMember.getRole()).isEqualTo(Role.OWNER);
        assertThat(savedMember.getUser().getId()).isEqualTo(ownerId);
    }

    @Test
    void getBoard_returnsFullTree() {
        UUID boardId = UUID.randomUUID();
        Board board = Board.builder()
                .id(boardId)
                .title("Full Board")
                .owner(owner)
                .columns(new ArrayList<>())
                .members(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .archived(false)
                .build();

        doNothing().when(boardAccessEvaluator).requireRole(boardId, ownerId, Role.VIEWER);
        when(boardRepository.findByIdWithFullTree(boardId)).thenReturn(Optional.of(board));

        BoardDetailResponse response = boardService.getBoard(boardId, ownerId);

        assertThat(response.getId()).isEqualTo(boardId);
        assertThat(response.getTitle()).isEqualTo("Full Board");
        verify(boardRepository).findByIdWithFullTree(boardId);
    }

    @Test
    void getBoard_nonMember_throwsAccessDeniedException() {
        UUID boardId = UUID.randomUUID();
        UUID nonMemberId = UUID.randomUUID();

        doThrow(new AccessDeniedException("User is not a member of this board"))
                .when(boardAccessEvaluator).requireRole(boardId, nonMemberId, Role.VIEWER);

        assertThatThrownBy(() -> boardService.getBoard(boardId, nonMemberId))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("not a member");
    }
}
