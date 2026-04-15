import { Editor } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import { TextInputModal } from "./textInputModal";

export function createSearchByRequesterCommand(plugin: ZendeskTicketsPlugin) {
	return {
		id: "zendesk-search-by-requester",
		name: "Search by Requester",
		editorCallback: (editor: Editor) => {
			new TextInputModal(
				plugin.app,
				"Search Tickets by Requester",
				"Enter requester email",
				(email: string) => {
					const block = `\`\`\`zendesk-search\nquery: type:ticket requester:${email}\n\`\`\`\n`;
					editor.replaceSelection(block);
				}
			).open();
		},
	};
}
