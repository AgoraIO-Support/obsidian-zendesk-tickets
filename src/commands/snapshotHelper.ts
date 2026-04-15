import type { IZendeskTicket } from "../interfaces/ticketInterfaces";
import type { IZendeskAccount } from "../interfaces/settingsInterfaces";
import { PRIORITY_LABELS } from "../interfaces/ticketInterfaces";

const MONTHS = [
	"Jan", "Feb", "Mar", "Apr", "May", "Jun",
	"Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export function formatDate(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

export function formatDateTime(date: Date): string {
	const hh = String(date.getHours()).padStart(2, "0");
	const mm = String(date.getMinutes()).padStart(2, "0");
	return `${formatDate(date)} ${hh}:${mm}`;
}

export function formatTicketDate(dateStr: string): string {
	const date = new Date(dateStr);
	const month = MONTHS[date.getMonth()];
	const day = date.getDate();
	const year = date.getFullYear();
	return `${month} ${day}, ${year}`;
}

function escapeSubject(subject: string): string {
	return subject.replace(/\|/g, "\\|");
}

function ticketUrl(subdomain: string, ticketId: number): string {
	return `https://${subdomain}.zendesk.com/agent/tickets/${ticketId}`;
}

function formatRow(
	ticket: IZendeskTicket,
	subdomain: string,
): string {
	const url = ticketUrl(subdomain, ticket.id);
	const link = `[#${ticket.id}](${url})`;
	const subject = escapeSubject(ticket.subject);
	const priority = ticket.priority
		? PRIORITY_LABELS[ticket.priority]
		: "-";
	const assignee = ticket.assignee_id != null
		? String(ticket.assignee_id)
		: "-";
	const updated = formatTicketDate(ticket.updated_at);

	return `| ${link} | ${subject} | ${ticket.status} | ${priority} | ${assignee} | ${updated} |`;
}

export function formatSnapshotTable(
	title: string,
	tickets: readonly IZendeskTicket[],
	account: IZendeskAccount,
	capturedAt: Date,
): string {
	const today = formatDate(capturedAt);
	const timestamp = formatDateTime(capturedAt);
	const header = `## Open Tickets (${title}) \u2014 ${today}`;
	const tableHeader = [
		"| # | Subject | Status | Priority | Assignee | Updated |",
		"|---|---------|--------|----------|----------|---------|",
	].join("\n");

	const rows = tickets.map((t) => formatRow(t, account.subdomain));
	const footer = `_${tickets.length} tickets \u00b7 Captured at ${timestamp}_`;

	return [header, "", tableHeader, ...rows, "", footer, ""].join("\n");
}
