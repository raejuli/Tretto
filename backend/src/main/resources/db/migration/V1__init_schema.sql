-- V1__init_schema.sql

CREATE TABLE users (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email        VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at   TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE boards (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id    UUID        NOT NULL REFERENCES users(id),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    archived    BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_boards_owner_id ON boards(owner_id);

CREATE TABLE board_members (
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id  UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    role     VARCHAR(20) NOT NULL,
    PRIMARY KEY (board_id, user_id)
);

CREATE INDEX idx_board_members_board_id ON board_members(board_id);
CREATE INDEX idx_board_members_user_id ON board_members(user_id);

CREATE TABLE board_columns (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id   UUID        NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title      VARCHAR(255) NOT NULL,
    position   INT         NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_board_columns_board_id ON board_columns(board_id);

CREATE TABLE cards (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    column_id   UUID        NOT NULL REFERENCES board_columns(id) ON DELETE CASCADE,
    board_id    UUID        NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    position    INT         NOT NULL,
    due_date    DATE,
    assignee_id UUID        REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cards_column_id ON cards(column_id);
CREATE INDEX idx_cards_board_id  ON cards(board_id);
CREATE INDEX idx_cards_assignee_id ON cards(assignee_id);

CREATE TABLE labels (
    id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID        NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    name     VARCHAR(100) NOT NULL,
    color    VARCHAR(50)  NOT NULL
);

CREATE INDEX idx_labels_board_id ON labels(board_id);

CREATE TABLE card_labels (
    card_id  UUID NOT NULL REFERENCES cards(id)  ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, label_id)
);

CREATE TABLE refresh_tokens (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP   NOT NULL,
    revoked    BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
