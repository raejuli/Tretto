package com.tretto.board;

import com.tretto.board.dto.BoardDetailResponse;
import com.tretto.board.dto.BoardRequest;
import com.tretto.board.dto.BoardSummaryResponse;
import com.tretto.card.Card;
import com.tretto.card.dto.CardResponse;
import com.tretto.column.BoardColumn;
import com.tretto.column.dto.ColumnResponse;
import com.tretto.exception.TrettoException;
import com.tretto.label.Label;
import com.tretto.member.BoardAccessEvaluator;
import com.tretto.member.BoardMember;
import com.tretto.member.BoardMemberId;
import com.tretto.member.BoardMemberRepository;
import com.tretto.member.Role;
import com.tretto.user.User;
import com.tretto.user.UserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final BoardAccessEvaluator boardAccessEvaluator;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<BoardSummaryResponse> getBoards(UUID userId) {
        return boardRepository.findAllByMemberUserId(userId).stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Transactional
    public BoardDetailResponse createBoard(BoardRequest request, User owner) {
        Board board = Board.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .owner(owner)
                .build();
        board = boardRepository.save(board);

        BoardMember ownerMember = BoardMember.builder()
                .id(new BoardMemberId(board.getId(), owner.getId()))
                .board(board)
                .user(owner)
                .role(Role.OWNER)
                .build();
        boardMemberRepository.save(ownerMember);

        log.info("Board {} created by user {}", board.getId(), owner.getId());
        return toDetailResponse(board);
    }

    @Transactional(readOnly = true)
    public BoardDetailResponse getBoard(UUID boardId, UUID userId) {
        boardAccessEvaluator.requireRole(boardId, userId, Role.VIEWER);
        Board board = boardRepository.findByIdWithFullTree(boardId)
                .orElseThrow(() -> new EntityNotFoundException("Board not found: " + boardId));
        return toDetailResponse(board);
    }

    @Transactional
    public BoardDetailResponse updateBoard(UUID boardId, BoardRequest request, UUID userId) {
        boardAccessEvaluator.requireRole(boardId, userId, Role.EDITOR);
        Board board = findBoardById(boardId);
        if (request.getTitle() != null) board.setTitle(request.getTitle());
        if (request.getDescription() != null) board.setDescription(request.getDescription());
        board = boardRepository.save(board);
        return toDetailResponse(board);
    }

    @Transactional
    public void deleteBoard(UUID boardId, UUID userId) {
        boardAccessEvaluator.requireRole(boardId, userId, Role.OWNER);
        Board board = findBoardById(boardId);
        board.setArchived(true);
        boardRepository.save(board);
        log.info("Board {} archived by user {}", boardId, userId);
    }

    @Transactional
    public void addMember(UUID boardId, String email, Role role, UUID requestingUserId) {
        boardAccessEvaluator.requireRole(boardId, requestingUserId, Role.OWNER);
        Board board = findBoardById(boardId);
        User user = userService.findByEmail(email);

        BoardMemberId memberId = new BoardMemberId(boardId, user.getId());
        if (boardMemberRepository.existsByBoardIdAndUserId(boardId, user.getId())) {
            BoardMember existing = boardMemberRepository.findByBoardIdAndUserId(boardId, user.getId()).get();
            existing.setRole(role);
            boardMemberRepository.save(existing);
        } else {
            BoardMember member = BoardMember.builder()
                    .id(memberId)
                    .board(board)
                    .user(user)
                    .role(role)
                    .build();
            boardMemberRepository.save(member);
        }
    }

    @Transactional
    public void removeMember(UUID boardId, UUID targetUserId, UUID requestingUserId) {
        boardAccessEvaluator.requireRole(boardId, requestingUserId, Role.OWNER);
        boardMemberRepository.deleteByBoardIdAndUserId(boardId, targetUserId);
    }

    private Board findBoardById(UUID boardId) {
        return boardRepository.findById(boardId)
                .filter(b -> !b.isArchived())
                .orElseThrow(() -> new EntityNotFoundException("Board not found: " + boardId));
    }

    private BoardSummaryResponse toSummaryResponse(Board board) {
        return BoardSummaryResponse.builder()
                .id(board.getId())
                .title(board.getTitle())
                .description(board.getDescription())
                .ownerId(board.getOwner().getId())
                .ownerDisplayName(board.getOwner().getDisplayName())
                .createdAt(board.getCreatedAt())
                .archived(board.isArchived())
                .columnCount(board.getColumns().size())
                .build();
    }

    public BoardDetailResponse toDetailResponse(Board board) {
        List<ColumnResponse> columnResponses = board.getColumns().stream()
                .map(col -> ColumnResponse.builder()
                        .id(col.getId())
                        .boardId(board.getId())
                        .title(col.getTitle())
                        .position(col.getPosition())
                        .createdAt(col.getCreatedAt())
                        .cards(col.getCards().stream()
                                .map(this::toCardResponse)
                                .toList())
                        .build())
                .toList();

        List<BoardDetailResponse.MemberInfo> memberInfos = board.getMembers().stream()
                .map(m -> BoardDetailResponse.MemberInfo.builder()
                        .userId(m.getUser().getId())
                        .displayName(m.getUser().getDisplayName())
                        .email(m.getUser().getEmail())
                        .role(m.getRole().name())
                        .build())
                .toList();

        return BoardDetailResponse.builder()
                .id(board.getId())
                .title(board.getTitle())
                .description(board.getDescription())
                .ownerId(board.getOwner().getId())
                .ownerDisplayName(board.getOwner().getDisplayName())
                .createdAt(board.getCreatedAt())
                .archived(board.isArchived())
                .columns(columnResponses)
                .members(memberInfos)
                .build();
    }

    private CardResponse toCardResponse(Card card) {
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
                .labels(card.getLabels().stream()
                        .map(l -> CardResponse.LabelInfo.builder()
                                .id(l.getId())
                                .name(l.getName())
                                .color(l.getColor())
                                .build())
                        .toList())
                .build();
    }
}
