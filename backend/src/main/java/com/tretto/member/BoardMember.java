package com.tretto.member;

import com.tretto.board.Board;
import com.tretto.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "board_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardMember {

    @EmbeddedId
    private BoardMemberId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("boardId")
    @JoinColumn(name = "board_id")
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
}
