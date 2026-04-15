import { Editor } from "obsidian";

export function createMyPendingTicketsCommand() {
	return {
		id: "zendesk-my-pending-tickets",
		name: "My Pending Tickets",
		editorCallback: (editor: Editor) => {
			const block = [
				"```zendesk-search",
				"query: type:ticket status:pending assignee:me",
				"limit: 25",
				"```",
				"",
			].join("\n");
			editor.replaceSelection(block);
		},
	};
}
