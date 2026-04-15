import { Editor, Notice } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import { TextInputModal } from "./textInputModal";

export function createInsertTicketLinkCommand(plugin: ZendeskTicketsPlugin) {
	return {
		id: "zendesk-insert-ticket-link",
		name: "Insert Ticket Link",
		editorCallback: (editor: Editor) => {
			const account = plugin.getAccountForQuery();
			if (!account) {
				new Notice("No Zendesk account configured.");
				return;
			}
			new TextInputModal(
				plugin.app,
				"Insert Ticket Link",
				"Enter ticket ID (e.g. 12345)",
				(ticketId: string) => {
					const url = `https://${account.subdomain}.zendesk.com/agent/tickets/${ticketId}`;
					const link = `[ZD#${ticketId}](${url})`;
					editor.replaceSelection(link);
				}
			).open();
		},
	};
}
