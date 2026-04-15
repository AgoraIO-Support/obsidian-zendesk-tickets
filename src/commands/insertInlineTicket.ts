import { Editor } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import { TextInputModal } from "./textInputModal";

export function createInsertInlineTicketCommand(plugin: ZendeskTicketsPlugin) {
	return {
		id: "zendesk-insert-inline",
		name: "Insert Inline Ticket",
		editorCallback: (editor: Editor) => {
			new TextInputModal(
				plugin.app,
				"Insert Inline Ticket Reference",
				"Enter ticket ID (e.g. 12345)",
				(ticketId: string) => {
					const prefix = plugin.settings.inlineTicketPrefix;
					editor.replaceSelection(`${prefix}${ticketId}`);
				}
			).open();
		},
	};
}
