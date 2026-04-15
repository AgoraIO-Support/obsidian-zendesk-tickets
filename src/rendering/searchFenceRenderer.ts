import { MarkdownPostProcessorContext } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import {
	IZendeskTicket,
	STATUS_COLORS,
	PRIORITY_LABELS,
	ZendeskTicketPriority,
} from "../interfaces/ticketInterfaces";
import {
	ESearchColumnType,
	ISearchColumn,
	IZendeskAccount,
} from "../interfaces/settingsInterfaces";
import { renderLoading, renderError, formatDate } from "./renderingCommon";

interface SearchBlockConfig {
	readonly query: string;
	readonly limit: number;
	readonly columns: readonly ISearchColumn[];
	readonly account: string;
}

function parseSearchBlock(source: string, defaultLimit: number, defaultColumns: readonly ISearchColumn[]): SearchBlockConfig {
	const lines = source.split("\n");
	let query = "";
	let limit = defaultLimit;
	let columns = defaultColumns;
	let account = "";

	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.startsWith("query:")) {
			query = trimmed.slice(6).trim();
		} else if (trimmed.startsWith("limit:")) {
			const n = parseInt(trimmed.slice(6).trim(), 10);
			if (!isNaN(n) && n > 0) limit = n;
		} else if (trimmed.startsWith("columns:")) {
			const colNames = trimmed.slice(8).trim().split(/[,\s]+/);
			columns = colNames
				.map((c) => c.toUpperCase())
				.filter((c) => c in ESearchColumnType)
				.map((c) => ({ type: c as ESearchColumnType, compact: false }));
		} else if (trimmed.startsWith("account:")) {
			account = trimmed.slice(8).trim();
		} else if (trimmed.length > 0 && !query) {
			query = trimmed;
		}
	}

	return { query, limit, columns, account };
}

function renderColumnHeader(col: ISearchColumn): string {
	switch (col.type) {
		case ESearchColumnType.ID: return "#";
		case ESearchColumnType.SUBJECT: return "Subject";
		case ESearchColumnType.STATUS: return "Status";
		case ESearchColumnType.PRIORITY: return "Priority";
		case ESearchColumnType.TYPE: return "Type";
		case ESearchColumnType.REQUESTER: return "Requester";
		case ESearchColumnType.ASSIGNEE: return "Assignee";
		case ESearchColumnType.GROUP: return "Group";
		case ESearchColumnType.CREATED: return "Created";
		case ESearchColumnType.UPDATED: return "Updated";
		case ESearchColumnType.TAGS: return "Tags";
	}
}

function renderCellValue(
	ticket: IZendeskTicket,
	col: ISearchColumn,
	account: IZendeskAccount
): string | HTMLElement {
	switch (col.type) {
		case ESearchColumnType.ID:
			return `#${ticket.id}`;
		case ESearchColumnType.SUBJECT:
			return ticket.subject;
		case ESearchColumnType.STATUS:
			return ticket.status;
		case ESearchColumnType.PRIORITY:
			return ticket.priority
				? PRIORITY_LABELS[ticket.priority as ZendeskTicketPriority] || ticket.priority
				: "-";
		case ESearchColumnType.TYPE:
			return ticket.type || "-";
		case ESearchColumnType.REQUESTER:
			return String(ticket.requester_id);
		case ESearchColumnType.ASSIGNEE:
			return ticket.assignee_id ? String(ticket.assignee_id) : "-";
		case ESearchColumnType.GROUP:
			return ticket.group_id ? String(ticket.group_id) : "-";
		case ESearchColumnType.CREATED:
			return formatDate(ticket.created_at);
		case ESearchColumnType.UPDATED:
			return formatDate(ticket.updated_at);
		case ESearchColumnType.TAGS:
			return ticket.tags.join(", ") || "-";
	}
}

export function createSearchFenceRenderer(plugin: ZendeskTicketsPlugin) {
	return async (
		source: string,
		el: HTMLElement,
		_ctx: MarkdownPostProcessorContext
	): Promise<void> => {
		const config = parseSearchBlock(
			source,
			plugin.settings.searchResultsLimit,
			plugin.settings.searchColumns
		);

		if (!config.query) {
			renderError(el, "No query specified in zendesk-search block");
			return;
		}

		const container = el.createDiv({ cls: "zd-search-fence" });
		const loadingEl = renderLoading(container);

		try {
			const account = config.account
				? plugin.getAccountByAlias(config.account)
				: plugin.getAccountForQuery();

			if (!account) {
				loadingEl.remove();
				renderError(container, config.account
					? `Account "${config.account}" not found`
					: "No Zendesk account configured");
				return;
			}

			const response = await plugin.client.searchTickets(
				account,
				config.query,
				config.limit
			);

			loadingEl.remove();

			// Result count
			container.createEl("div", {
				cls: "zd-search-count",
				text: `${response.count} ticket${response.count !== 1 ? "s" : ""} found`,
			});

			if (response.results.length === 0) return;

			// Table
			const table = container.createEl("table", { cls: "zd-search-table" });
			const thead = table.createEl("thead");
			const headerRow = thead.createEl("tr");

			for (const col of config.columns) {
				headerRow.createEl("th", { text: renderColumnHeader(col) });
			}

			const tbody = table.createEl("tbody");

			for (const ticket of response.results) {
				const row = tbody.createEl("tr", { cls: `zd-status-${ticket.status}` });

				for (const col of config.columns) {
					const td = row.createEl("td");

					if (col.type === ESearchColumnType.ID) {
						const link = td.createEl("a", {
							text: `#${ticket.id}`,
							href: `https://${account.subdomain}.zendesk.com/agent/tickets/${ticket.id}`,
						});
						link.setAttr("target", "_blank");
						link.setAttr("rel", "noopener");
					} else if (col.type === ESearchColumnType.STATUS) {
						const statusColor = STATUS_COLORS[ticket.status] || "#87929d";
						const badge = td.createEl("span", {
							cls: "zd-status-badge",
							text: ticket.status,
						});
						badge.style.backgroundColor = statusColor;
					} else {
						const value = renderCellValue(ticket, col, account);
						if (typeof value === "string") {
							td.setText(value);
						} else {
							td.appendChild(value);
						}
					}
				}
			}
		} catch (err) {
			loadingEl.remove();
			const msg = err instanceof Error ? err.message : String(err);
			renderError(container, `Search failed: ${msg}`);
		}
	};
}
