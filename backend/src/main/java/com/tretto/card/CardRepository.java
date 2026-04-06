package com.tretto.card;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CardRepository extends JpaRepository<Card, UUID> {

    int countByColumnId(UUID columnId);

    @Modifying
    @Query("UPDATE Card c SET c.position = c.position - 1 WHERE c.column.id = :columnId AND c.position > :position")
    void decrementPositionsAfter(UUID columnId, int position);

    @Modifying
    @Query("UPDATE Card c SET c.position = c.position + 1 WHERE c.column.id = :columnId AND c.position >= :position")
    void incrementPositionsFrom(UUID columnId, int position);
}
