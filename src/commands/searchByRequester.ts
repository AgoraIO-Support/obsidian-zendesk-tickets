import { Editor } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import { TextInputModal } from "./textInputModal";

export function createSearchByOrganizationCommand(plugin: ZendeskTicketsPlugin) {
	return {
		id: "zendesk-search-by-organization",
		name: "Search by Organization",
		editorCallback: (editor: Editor) => {
			new TextInputModal(
				plugin.app,
				"Search Tickets by Organization",
				"Enter organization name",
				(org: string) => {
					const block = `\`\`\`zendesk-search\nquery: type:ticket organization:${org}\n\`\`\`\n`;
					editor.replaceSelection(block);
				}
			).open();
		},
	};
}
