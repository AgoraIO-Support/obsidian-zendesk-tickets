import { IZendeskTicket, STATUS_COLORS } from "../interfaces/ticketInterfaces";
import { IZendeskAccount } from "../interfaces/settingsInterfaces";

export function renderTicketTag(
	container: HTMLElement,
	ticket: IZendeskTicket,
	account: IZendeskAccount,
	showColorBand: boolean
): HTMLElement {
	const tag = container.createEl("span", { cls: "zd-ticket-tag" });

	if (showColorBand) {
		tag.createEl("span", {
			cls: "zd-color-band",
			attr: { style: `background-color: ${account.color}` },
		});
	}

	const statusColor = STATUS_COLORS[ticket.status] || "#87929d";
	tag.createEl("span", {
		cls: `zd-status-dot`,
		attr: { style: `background-color: ${statusColor}` },
	});

	const link = tag.createEl("a", {
		cls: "zd-ticket-link",
		text: `#${ticket.id}`,
		href: `https://${account.subdomain}.zendesk.com/agent/tickets/${ticket.id}`,
	});
	link.setAttr("target", "_blank");
	link.setAttr("rel", "noopener");

	tag.createEl("span", {
		cls: "zd-ticket-subject",
		text: ticket.subject,
	});

	return tag;
}

export function renderLoading(container: HTMLElement): HTMLElement {
	return container.createEl("span", {
		cls: "zd-loading",
		text: "Loading...",
	});
}

export function renderError(container: HTMLElement, message: string): HTMLElement {
	return container.createEl("span", {
		cls: "zd-error",
		text: message,
	});
}

export function formatDate(dateStr: string): string {
	try {
		const date = new Date(dateStr);
		return date.toLocaleDateString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	} catch {
		return dateStr;
	}
}
