package com.tretto.board;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BoardRepository extends JpaRepository<Board, UUID> {

    @Query("SELECT DISTINCT b FROM Board b JOIN b.members m WHERE m.user.id = :userId AND b.archived = false")
    List<Board> findAllByMemberUserId(UUID userId);

    @EntityGraph(attributePaths = {
            "columns",
            "columns.cards",
            "columns.cards.assignee",
            "columns.cards.labels",
            "members",
            "members.user",
            "owner"
    })
    @Query("SELECT b FROM Board b WHERE b.id = :id AND b.archived = false")
    Optional<Board> findByIdWithFullTree(UUID id);
}
