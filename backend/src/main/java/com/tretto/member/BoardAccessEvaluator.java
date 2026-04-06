package com.tretto.member;

import com.tretto.exception.TrettoException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class BoardAccessEvaluator {

    private final BoardMemberRepository boardMemberRepository;

    public Role getRole(UUID boardId, UUID userId) {
        return boardMemberRepository.findByBoardIdAndUserId(boardId, userId)
                .map(BoardMember::getRole)
                .orElseThrow(() -> new AccessDeniedException("User is not a member of this board"));
    }

    public void requireRole(UUID boardId, UUID userId, Role minimumRole) {
        Role role = getRole(boardId, userId);
        if (!hasAtLeast(role, minimumRole)) {
            throw new AccessDeniedException("Insufficient board permissions");
        }
    }

    public boolean isMember(UUID boardId, UUID userId) {
        return boardMemberRepository.existsByBoardIdAndUserId(boardId, userId);
    }

    private boolean hasAtLeast(Role actual, Role required) {
        return switch (required) {
            case VIEWER -> true;
            case EDITOR -> actual == Role.EDITOR || actual == Role.OWNER;
            case OWNER -> actual == Role.OWNER;
        };
    }
}
