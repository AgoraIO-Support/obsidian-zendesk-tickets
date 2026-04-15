import { Editor } from "obsidian";

export function createAllOpenTicketsCommand() {
	return {
		id: "zendesk-all-open-tickets",
		name: "All Open Tickets",
		editorCallback: (editor: Editor) => {
			const block = [
				"```zendesk-search",
				"query: type:ticket status<solved order_by:updated_at sort:desc",
				"```",
				"",
			].join("\n");
			editor.replaceSelection(block);
		},
	};
}
