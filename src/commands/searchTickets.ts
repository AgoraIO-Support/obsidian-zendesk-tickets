import { Editor } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import { TextInputModal } from "./textInputModal";

export function createSearchTicketsCommand(plugin: ZendeskTicketsPlugin) {
	return {
		id: "zendesk-search-tickets",
		name: "Search Tickets",
		editorCallback: (editor: Editor) => {
			new TextInputModal(
				plugin.app,
				"Search Zendesk Tickets",
				"Enter search query (e.g. status:open assignee:me)",
				(query: string) => {
					const block = `\`\`\`zendesk-search\nquery: ${query}\n\`\`\`\n`;
					editor.replaceSelection(block);
				}
			).open();
		},
	};
}
