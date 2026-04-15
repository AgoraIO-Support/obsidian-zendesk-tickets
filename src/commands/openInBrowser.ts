import { Notice } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import { TextInputModal } from "./textInputModal";

export function createOpenInBrowserCommand(plugin: ZendeskTicketsPlugin) {
	return {
		id: "zendesk-open-in-browser",
		name: "Open Ticket in Browser",
		callback: () => {
			const account = plugin.getAccountForQuery();
			if (!account) {
				new Notice("No Zendesk account configured.");
				return;
			}
			new TextInputModal(
				plugin.app,
				"Open Ticket in Browser",
				"Enter ticket ID (e.g. 12345)",
				(ticketId: string) => {
					const url = `https://${account.subdomain}.zendesk.com/agent/tickets/${ticketId}`;
					window.open(url);
				}
			).open();
		},
	};
}
