export interface IZendeskUser {
	readonly id: number;
	readonly name: string;
	readonly email: string;
	readonly photo: { readonly content_url: string } | null;
}

export interface IZendeskGroup {
	readonly id: number;
	readonly name: string;
}

export interface IZendeskTicket {
	readonly id: number;
	readonly subject: string;
	readonly description: string;
	readonly status: ZendeskTicketStatus;
	readonly priority: ZendeskTicketPriority | null;
	readonly type: string | null;
	readonly tags: readonly string[];
	readonly requester_id: number;
	readonly assignee_id: number | null;
	readonly group_id: number | null;
	readonly created_at: string;
	readonly updated_at: string;
	readonly url: string;
}

export type ZendeskTicketStatus =
	| "new"
	| "open"
	| "pending"
	| "hold"
	| "solved"
	| "closed";

export type ZendeskTicketPriority =
	| "low"
	| "normal"
	| "high"
	| "urgent";

export interface IZendeskSearchResponse {
	readonly results: readonly IZendeskTicket[];
	readonly count: number;
	readonly next_page: string | null;
	readonly previous_page: string | null;
}

export interface IZendeskTicketResponse {
	readonly ticket: IZendeskTicket;
}

export const STATUS_COLORS: Record<ZendeskTicketStatus, string> = {
	new: "#5db5c4",
	open: "#e84855",
	pending: "#5bc0de",
	hold: "#2c2c2c",
	solved: "#87929d",
	closed: "#87929d",
};

export const PRIORITY_LABELS: Record<ZendeskTicketPriority, string> = {
	low: "Low",
	normal: "Normal",
	high: "High",
	urgent: "Urgent",
};
