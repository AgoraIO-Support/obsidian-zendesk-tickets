import { Editor } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import { TextInputModal } from "./textInputModal";

export function createSearchByTagCommand(plugin: ZendeskTicketsPlugin) {
	return {
		id: "zendesk-search-by-tag",
		name: "Search by Tag",
		editorCallback: (editor: Editor) => {
			new TextInputModal(
				plugin.app,
				"Search Tickets by Tag",
				"Enter tag name",
				(tag: string) => {
					const block = `\`\`\`zendesk-search\nquery: type:ticket tags:${tag}\n\`\`\`\n`;
					editor.replaceSelection(block);
				}
			).open();
		},
	};
}
