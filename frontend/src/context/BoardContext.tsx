import React, { createContext, useCallback, useReducer } from 'react';
import { BoardDetail, Card, Column, Label } from '../types';
import * as boardsApi from '../api/boards';
import * as cardsApi from '../api/cards';
import * as columnsApi from '../api/columns';

interface BoardState {
  board: BoardDetail | null;
  loading: boolean;
  error: string | null;
}

type BoardAction =
  | { type: 'SET_BOARD'; board: BoardDetail }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'MOVE_CARD'; cardId: string; fromColumnId: string; toColumnId: string; newIndex: number }
  | { type: 'MOVE_COLUMN'; columnId: string; newIndex: number }
  | { type: 'ADD_CARD'; card: Card; columnId: string }
  | { type: 'UPDATE_CARD'; card: Partial<Card> & { id: string } }
  | { type: 'DELETE_CARD'; cardId: string; columnId: string }
  | { type: 'ADD_COLUMN'; column: Column }
  | { type: 'UPDATE_COLUMN'; columnId: string; title: string }
  | { type: 'DELETE_COLUMN'; columnId: string }
  | { type: 'ROLLBACK'; board: BoardDetail };

function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'SET_BOARD':
      return { ...state, board: action.board, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'ROLLBACK':
      return { ...state, board: action.board, error: 'Move failed. Changes reverted.' };
    case 'MOVE_CARD': {
      if (!state.board) return state;
      const columns = state.board.columns.map((col) => {
        if (col.id === action.fromColumnId) {
          return { ...col, cards: col.cards.filter((c) => c.id !== action.cardId) };
        }
        return col;
      });
      const card = state.board.columns
        .find((c) => c.id === action.fromColumnId)
        ?.cards.find((c) => c.id === action.cardId);
      if (!card) return state;
      const updatedColumns = columns.map((col) => {
        if (col.id === action.toColumnId) {
          const newCards = [...col.cards];
          newCards.splice(action.newIndex, 0, { ...card, position: action.newIndex });
          return { ...col, cards: newCards.map((c, i) => ({ ...c, position: i })) };
        }
        return col;
      });
      return { ...state, board: { ...state.board, columns: updatedColumns } };
    }
    case 'MOVE_COLUMN': {
      if (!state.board) return state;
      const cols = [...state.board.columns];
      const idx = cols.findIndex((c) => c.id === action.columnId);
      if (idx === -1) return state;
      const [moved] = cols.splice(idx, 1);
      cols.splice(action.newIndex, 0, moved);
      return { ...state, board: { ...state.board, columns: cols.map((c, i) => ({ ...c, position: i })) } };
    }
    case 'ADD_CARD': {
      if (!state.board) return state;
      const columns = state.board.columns.map((col) => {
        if (col.id === action.columnId) {
          return { ...col, cards: [...col.cards, action.card] };
        }
        return col;
      });
      return { ...state, board: { ...state.board, columns } };
    }
    case 'UPDATE_CARD': {
      if (!state.board) return state;
      const columns = state.board.columns.map((col) => ({
        ...col,
        cards: col.cards.map((c) => (c.id === action.card.id ? { ...c, ...action.card } : c)),
      }));
      return { ...state, board: { ...state.board, columns } };
    }
    case 'DELETE_CARD': {
      if (!state.board) return state;
      const columns = state.board.columns.map((col) => {
        if (col.id === action.columnId) {
          return { ...col, cards: col.cards.filter((c) => c.id !== action.cardId) };
        }
        return col;
      });
      return { ...state, board: { ...state.board, columns } };
    }
    case 'ADD_COLUMN': {
      if (!state.board) return state;
      return { ...state, board: { ...state.board, columns: [...state.board.columns, action.column] } };
    }
    case 'UPDATE_COLUMN': {
      if (!state.board) return state;
      const columns = state.board.columns.map((col) =>
        col.id === action.columnId ? { ...col, title: action.title } : col,
      );
      return { ...state, board: { ...state.board, columns } };
    }
    case 'DELETE_COLUMN': {
      if (!state.board) return state;
      const columns = state.board.columns.filter((col) => col.id !== action.columnId);
      return { ...state, board: { ...state.board, columns } };
    }
    default:
      return state;
  }
}

interface BoardContextValue {
  state: BoardState;
  loadBoard: (boardId: string) => Promise<void>;
  moveCard: (cardId: string, fromColumnId: string, toColumnId: string, newIndex: number) => Promise<void>;
  moveColumn: (columnId: string, newIndex: number) => Promise<void>;
  addCard: (columnId: string, title: string) => Promise<void>;
  addColumn: (title: string) => Promise<void>;
  updateCard: (cardId: string, columnId: string, data: Partial<Pick<Card, 'title' | 'description' | 'dueDate'> & { assigneeId: string | null }>) => Promise<void>;
  deleteCard: (cardId: string, columnId: string) => Promise<void>;
  renameColumn: (columnId: string, title: string) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
  addLabelToCard: (cardId: string, columnId: string, label: Label) => Promise<void>;
  removeLabelFromCard: (cardId: string, columnId: string, labelId: string) => Promise<void>;
  dispatch: React.Dispatch<BoardAction>;
}

export const BoardContext = createContext<BoardContextValue | null>(null);

export function BoardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(boardReducer, { board: null, loading: false, error: null });

  const loadBoard = useCallback(async (boardId: string) => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const board = await boardsApi.getBoard(boardId);
      dispatch({ type: 'SET_BOARD', board });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', error: (e as Error).message });
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  const moveCard = useCallback(async (cardId: string, fromColumnId: string, toColumnId: string, newIndex: number) => {
    if (!state.board) return;
    const snapshot = state.board;
    dispatch({ type: 'MOVE_CARD', cardId, fromColumnId, toColumnId, newIndex });
    try {
      await cardsApi.moveCard(state.board.id, cardId, toColumnId, newIndex);
    } catch (_e) {
      dispatch({ type: 'ROLLBACK', board: snapshot });
    }
  }, [state.board]);

  const moveColumn = useCallback(async (columnId: string, newIndex: number) => {
    if (!state.board) return;
    const snapshot = state.board;
    dispatch({ type: 'MOVE_COLUMN', columnId, newIndex });
    try {
      await columnsApi.moveColumn(state.board.id, columnId, newIndex);
    } catch (_e) {
      dispatch({ type: 'ROLLBACK', board: snapshot });
    }
  }, [state.board]);

  const addCard = useCallback(async (columnId: string, title: string) => {
    if (!state.board) return;
    const card = await cardsApi.createCard(state.board.id, columnId, title);
    dispatch({ type: 'ADD_CARD', card, columnId });
  }, [state.board]);

  const addColumn = useCallback(async (title: string) => {
    if (!state.board) return;
    const column = await columnsApi.createColumn(state.board.id, title);
    dispatch({ type: 'ADD_COLUMN', column });
  }, [state.board]);

  const updateCard = useCallback(async (
    cardId: string,
    columnId: string,
    data: Partial<Pick<Card, 'title' | 'description' | 'dueDate'> & { assigneeId: string | null }>,
  ) => {
    const updated = await cardsApi.updateCard(cardId, data);
    dispatch({ type: 'UPDATE_CARD', card: { ...updated, id: cardId } });
  }, []);

  const deleteCard = useCallback(async (cardId: string, columnId: string) => {
    await cardsApi.deleteCard(cardId);
    dispatch({ type: 'DELETE_CARD', cardId, columnId });
  }, []);

  const renameColumn = useCallback(async (columnId: string, title: string) => {
    await columnsApi.renameColumn(columnId, title);
    dispatch({ type: 'UPDATE_COLUMN', columnId, title });
  }, []);

  const deleteColumn = useCallback(async (columnId: string) => {
    await columnsApi.deleteColumn(columnId);
    dispatch({ type: 'DELETE_COLUMN', columnId });
  }, []);

  const addLabelToCard = useCallback(async (cardId: string, columnId: string, label: Label) => {
    await cardsApi.addLabelToCard(cardId, label.id);
    dispatch({
      type: 'UPDATE_CARD',
      card: {
        id: cardId,
        labels: (() => {
          const col = state.board?.columns.find((c) => c.id === columnId);
          const card = col?.cards.find((c) => c.id === cardId);
          if (!card) return [label];
          if (card.labels.find((l) => l.id === label.id)) return card.labels;
          return [...card.labels, label];
        })(),
      },
    });
  }, [state.board]);

  const removeLabelFromCard = useCallback(async (cardId: string, columnId: string, labelId: string) => {
    await cardsApi.removeLabelFromCard(cardId, labelId);
    dispatch({
      type: 'UPDATE_CARD',
      card: {
        id: cardId,
        labels: (() => {
          const col = state.board?.columns.find((c) => c.id === columnId);
          const card = col?.cards.find((c) => c.id === cardId);
          return card ? card.labels.filter((l) => l.id !== labelId) : [];
        })(),
      },
    });
  }, [state.board]);

  return (
    <BoardContext.Provider value={{
      state, loadBoard, moveCard, moveColumn, addCard, addColumn,
      updateCard, deleteCard, renameColumn, deleteColumn,
      addLabelToCard, removeLabelFromCard, dispatch,
    }}>
      {children}
    </BoardContext.Provider>
  );
}

