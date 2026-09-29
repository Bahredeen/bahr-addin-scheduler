export type TabKey = "dashboard" | "planner" | "approvals" | "notebook";

export type VisibilityLevel = "PUBLIC" | "PARTIALLY_VISIBLE" | "HIDDEN";
export type ItemType = "ACTIVITY" | "MEETING";
export type ItemStatus = "PENDING" | "LOCKED" | "DECLINED";
export type ApprovalState = "PENDING" | "ACCEPTED" | "DECLINED";
export type JoinRequestState = "PENDING" | "APPROVED" | "REJECTED";
export type NotebookCategory = "PLANT_FLOOR" | "SHIFT_HANDOVER" | "MEETING_MINUTES";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  groupId: string;
  groupIds: string[];
  avatarColor: string;
  verified: boolean;
  isManager: boolean;
  visibility: VisibilityLevel;
}

export interface CompanyGroup {
  id: string;
  name: string;
  industry: string;
  joinCode: string;
}

export interface ScheduleItem {
  id: string;
  type: ItemType;
  title: string;
  agenda: string;
  date: string;
  start: string;
  end: string;
  room: string;
  ownerId: string;
  participantIds: string[];
  externalGuests: string[];
  visibility: VisibilityLevel;
  status: ItemStatus;
  urgentOverride: boolean;
  demo?: boolean;
  createdAt: number;
}

export type DraftScheduleItem = Omit<ScheduleItem, "id" | "createdAt" | "status">;

export interface ApprovalRequest {
  id: string;
  scheduleItemId: string;
  inviteeId: string;
  inviterId: string;
  state: ApprovalState;
  demo?: boolean;
  createdAt: number;
}

export interface NotebookEntry {
  id: string;
  category: NotebookCategory;
  title: string;
  body: string;
  tags: string[];
  authorId: string;
  createdAt: number;
}

export interface JoinRequest {
  id: string;
  groupId: string;
  userId: string;
  state: JoinRequestState;
  createdAt: number;
}

export interface AppState {
  currentUserId: string | null;
  currentGroupId: string;
  users: User[];
  groups: CompanyGroup[];
  scheduleItems: ScheduleItem[];
  approvals: ApprovalRequest[];
  notebook: NotebookEntry[];
  joinRequests: JoinRequest[];
  soundEnabled: boolean;
  seedDate: string;
}

export const MEETING_ROOMS = [
  "Boardroom 1",
  "Boardroom 2",
  "Cobalt Suite",
  "Dispatch Bay",
  "Plant Floor A",
  "Plant Floor B",
  "Compliance Suite",
  "Meeting Pod 4",
  "Training Room",
];

export const WORK_START = "08:00";
export const WORK_END = "18:00";

export const VISIBILITY_META: Record<VisibilityLevel, { label: string; hint: string }> = {
  PUBLIC: { label: "Public", hint: "Full details shared with your group" },
  PARTIALLY_VISIBLE: { label: "Partial", hint: "Peers see a blocked, restricted slot" },
  HIDDEN: { label: "Hidden", hint: "Slot stays private, conflict engine still detects it" },
};

export const CATEGORY_META: Record<NotebookCategory, { label: string }> = {
  PLANT_FLOOR: { label: "Plant Floor Update" },
  SHIFT_HANDOVER: { label: "Shift Handover" },
  MEETING_MINUTES: { label: "Meeting Minutes" },
};