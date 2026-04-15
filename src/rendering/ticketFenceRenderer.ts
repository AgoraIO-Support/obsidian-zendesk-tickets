import { MarkdownPostProcessorContext } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import { renderTicketTag, renderLoading, renderError } from "./renderingCommon";

const TICKET_ID_RE = /^\s*(\d+)\s*$/;

export function createTicketFenceRenderer(plugin: ZendeskTicketsPlugin) {
	return async (
		source: string,
		el: HTMLElement,
		_ctx: MarkdownPostProcessorContext
	): Promise<void> => {
		const lines = source.split("\n").filter((l) => l.trim().length > 0);
		const container = el.createDiv({ cls: "zd-ticket-fence" });

		for (const line of lines) {
			const match = line.match(TICKET_ID_RE);
			if (!match) {
				renderError(container, `Invalid ticket ID: ${line.trim()}`);
				continue;
			}

			const ticketId = parseInt(match[1], 10);
			const row = container.createDiv({ cls: "zd-ticket-row" });
			const loadingEl = renderLoading(row);

			try {
				const account = plugin.getAccountForQuery();
				if (!account) {
					loadingEl.remove();
					renderError(row, "No Zendesk account configured");
					continue;
				}

				const ticket = await plugin.client.getTicket(account, ticketId);
				loadingEl.remove();
				renderTicketTag(row, ticket, account, plugin.settings.showColorBand);
			} catch (err) {
				loadingEl.remove();
				const msg = err instanceof Error ? err.message : String(err);
				renderError(row, `Ticket #${ticketId}: ${msg}`);
			}
		}
	};
}
