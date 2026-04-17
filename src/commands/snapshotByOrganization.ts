import { Editor, Notice } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import { TextInputModal } from "./textInputModal";
import { runZendeskSnapshot } from "./snapshotCore";

export function createSnapshotByOrganizationCommand(
	plugin: ZendeskTicketsPlugin,
) {
	return {
		id: "zendesk-snapshot-by-organization",
		name: "Snapshot: Open Tickets by Organization",
		editorCallback: (editor: Editor) => {
			const account = plugin.getAccountForQuery();
			if (!account) {
				new Notice("No Zendesk account configured.");
				return;
			}

			new TextInputModal(
				plugin.app,
				"Snapshot: Open Tickets by Organization",
				"Enter organization name, company ID, or company name",
				async (term: string) => {
					try {
						new Notice(`Searching organizations matching "${term}"...`);
						const { markdown, count } = await runZendeskSnapshot(
							plugin,
							"organization",
							term,
						);
						editor.replaceSelection(markdown);
						new Notice(`Inserted ${count} tickets`);
					} catch (err) {
						new Notice(
							`Snapshot failed: ${err instanceof Error ? err.message : String(err)}`,
							8000,
						);
					}
				},
			).open();
		},
	};
}
