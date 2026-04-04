package com.tretto.member;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BoardMemberRepository extends JpaRepository<BoardMember, BoardMemberId> {
    Optional<BoardMember> findByBoardIdAndUserId(UUID boardId, UUID userId);
    List<BoardMember> findByBoardId(UUID boardId);
    boolean existsByBoardIdAndUserId(UUID boardId, UUID userId);
    void deleteByBoardIdAndUserId(UUID boardId, UUID userId);
}
