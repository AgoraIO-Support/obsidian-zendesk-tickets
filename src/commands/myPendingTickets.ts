import { Editor } from "obsidian";
import type ZendeskTicketsPlugin from "../main";

export function createMyPendingTicketsCommand(plugin: ZendeskTicketsPlugin) {
	return {
		id: "zendesk-my-pending-tickets",
		name: "My Pending Tickets",
		editorCallback: (editor: Editor) => {
			const assignee = plugin.getAssigneeQuery();
			const block = [
				"```zendesk-search",
				`query: type:ticket status:pending ${assignee}`,
				"limit: 25",
				"```",
				"",
			].join("\n");
			editor.replaceSelection(block);
		},
	};
}
