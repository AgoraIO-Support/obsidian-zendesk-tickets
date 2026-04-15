import { Editor } from "obsidian";
import type ZendeskTicketsPlugin from "../main";

export function createMyOpenTicketsCommand(plugin: ZendeskTicketsPlugin) {
	return {
		id: "zendesk-my-open-tickets",
		name: "My Open Tickets",
		editorCallback: (editor: Editor) => {
			const assignee = plugin.getAssigneeQuery();
			const block = [
				"```zendesk-search",
				`query: type:ticket status<solved ${assignee}`,
				"limit: 25",
				"```",
				"",
			].join("\n");
			editor.replaceSelection(block);
		},
	};
}
