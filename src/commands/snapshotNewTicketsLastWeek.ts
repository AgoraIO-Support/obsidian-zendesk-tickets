import { Editor, Notice } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import { runZendeskSnapshot } from "./snapshotCore";

export function createSnapshotNewTicketsLastWeekCommand(
	plugin: ZendeskTicketsPlugin,
) {
	return {
		id: "zendesk-snapshot-new-tickets-last-week",
		name: "Snapshot: New Tickets Last Week",
		editorCallback: async (editor: Editor) => {
			const account = plugin.getAccountForQuery();
			if (!account) {
				new Notice("No Zendesk account configured.");
				return;
			}

			try {
				const { markdown } = await runZendeskSnapshot(
					plugin,
					"newLastWeek",
					"",
				);
				editor.replaceSelection(markdown);
			} catch (err) {
				new Notice(
					`Snapshot failed: ${err instanceof Error ? err.message : String(err)}`,
				);
			}
		},
	};
}
