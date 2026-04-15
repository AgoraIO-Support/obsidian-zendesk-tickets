import { Editor } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import { TextInputModal } from "./textInputModal";

export function createInsertTicketCommand(plugin: ZendeskTicketsPlugin) {
	return {
		id: "zendesk-insert-ticket",
		name: "Insert Ticket",
		editorCallback: (editor: Editor) => {
			new TextInputModal(
				plugin.app,
				"Insert Zendesk Ticket",
				"Enter ticket ID (e.g. 12345)",
				(ticketId: string) => {
					const block = `\`\`\`zendesk-ticket\n${ticketId}\n\`\`\`\n`;
					editor.replaceSelection(block);
				}
			).open();
		},
	};
}
