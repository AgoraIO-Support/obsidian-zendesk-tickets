import { Editor } from "obsidian";

export function createRecentTicketsCommand() {
	return {
		id: "zendesk-recent-tickets",
		name: "Recent Tickets",
		editorCallback: (editor: Editor) => {
			const block = [
				"```zendesk-search",
				"query: type:ticket order_by:updated_at sort:desc",
				"limit: 10",
				"```",
				"",
			].join("\n");
			editor.replaceSelection(block);
		},
	};
}
