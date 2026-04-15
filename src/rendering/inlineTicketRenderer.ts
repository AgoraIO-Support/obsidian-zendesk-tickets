import type ZendeskTicketsPlugin from "../main";
import { renderTicketTag, renderError } from "./renderingCommon";

const TICKET_ID_PLACEHOLDER_CLASS = "zd-inline-ticket";

export function createInlineTicketProcessor(plugin: ZendeskTicketsPlugin) {
	return (el: HTMLElement): void => {
		const prefix = escapeRegex(plugin.settings.inlineTicketPrefix);
		const pattern = new RegExp(`${prefix}(\\d+)`, "g");

		const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
		const textNodes: Text[] = [];

		let node: Text | null;
		while ((node = walker.nextNode() as Text | null)) {
			if (pattern.test(node.textContent || "")) {
				textNodes.push(node);
			}
			pattern.lastIndex = 0;
		}

		for (const textNode of textNodes) {
			const content = textNode.textContent || "";
			const fragment = document.createDocumentFragment();
			let lastIndex = 0;

			pattern.lastIndex = 0;
			let match: RegExpExecArray | null;

			while ((match = pattern.exec(content)) !== null) {
				if (match.index > lastIndex) {
					fragment.appendChild(
						document.createTextNode(content.slice(lastIndex, match.index))
					);
				}

				const ticketId = parseInt(match[1], 10);
				const placeholder = document.createElement("span");
				placeholder.classList.add(TICKET_ID_PLACEHOLDER_CLASS);
				placeholder.dataset.ticketId = String(ticketId);
				placeholder.textContent = `${plugin.settings.inlineTicketPrefix}${ticketId}`;
				fragment.appendChild(placeholder);

				lastIndex = pattern.lastIndex;
			}

			if (lastIndex < content.length) {
				fragment.appendChild(
					document.createTextNode(content.slice(lastIndex))
				);
			}

			textNode.replaceWith(fragment);
		}

		// Resolve placeholders asynchronously
		const placeholders = el.querySelectorAll(`.${TICKET_ID_PLACEHOLDER_CLASS}`);
		for (const ph of Array.from(placeholders)) {
			const ticketId = parseInt(
				(ph as HTMLElement).dataset.ticketId || "0",
				10
			);
			if (ticketId <= 0) continue;

			resolveInlineTicket(plugin, ph as HTMLElement, ticketId);
		}
	};
}

async function resolveInlineTicket(
	plugin: ZendeskTicketsPlugin,
	el: HTMLElement,
	ticketId: number
): Promise<void> {
	try {
		const account = plugin.getAccountForQuery();
		if (!account) {
			el.classList.add("zd-error");
			el.textContent = `ZD:${ticketId} (no account)`;
			return;
		}

		const ticket = await plugin.client.getTicket(account, ticketId);
		el.empty();
		renderTicketTag(el, ticket, account, plugin.settings.showColorBand);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		el.empty();
		renderError(el, `#${ticketId}: ${msg}`);
	}
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
