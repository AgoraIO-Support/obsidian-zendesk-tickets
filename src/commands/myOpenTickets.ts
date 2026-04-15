import { Editor } from "obsidian";

export function createMyOpenTicketsCommand() {
	return {
		id: "zendesk-my-open-tickets",
		name: "My Open Tickets",
		editorCallback: (editor: Editor) => {
			const block = [
				"```zendesk-search",
				"query: type:ticket status<solved assignee:me",
				"limit: 25",
				"```",
				"",
			].join("\n");
			editor.replaceSelection(block);
		},
	};
}
