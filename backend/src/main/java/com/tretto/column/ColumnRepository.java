package com.tretto.column;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ColumnRepository extends JpaRepository<BoardColumn, UUID> {

    List<BoardColumn> findByBoardIdOrderByPositionAsc(UUID boardId);

    int countByBoardId(UUID boardId);

    @Modifying
    @Query("UPDATE BoardColumn c SET c.position = c.position - 1 WHERE c.board.id = :boardId AND c.position > :position")
    void decrementPositionsAfter(UUID boardId, int position);

    @Modifying
    @Query("UPDATE BoardColumn c SET c.position = c.position + 1 WHERE c.board.id = :boardId AND c.position >= :position")
    void incrementPositionsFrom(UUID boardId, int position);
}
