export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthResponse {
  accessToken: string;
  userId: string;
  email: string;
  displayName: string;
}

export type Role = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface BoardMember {
  userId: string;
  displayName: string;
  email: string;
  role: Role;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  position: number;
  dueDate: string | null;
  assignee: { id: string; displayName: string } | null;
  labels: Label[];
}

export interface Column {
  id: string;
  title: string;
  position: number;
  cards: Card[];
}

export interface BoardSummary {
  id: string;
  title: string;
  description: string;
  archived: boolean;
  createdAt: string;
}

export interface BoardDetail extends BoardSummary {
  columns: Column[];
  members: BoardMember[];
  myRole: Role;
}
