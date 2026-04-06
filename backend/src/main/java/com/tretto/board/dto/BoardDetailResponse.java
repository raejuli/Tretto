package com.tretto.board.dto;

import com.tretto.column.dto.ColumnResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardDetailResponse {
    private UUID id;
    private String title;
    private String description;
    private UUID ownerId;
    private String ownerDisplayName;
    private LocalDateTime createdAt;
    private boolean archived;
    private List<ColumnResponse> columns;
    private List<MemberInfo> members;
    private String myRole;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberInfo {
        private UUID userId;
        private String displayName;
        private String email;
        private String role;
    }
}
