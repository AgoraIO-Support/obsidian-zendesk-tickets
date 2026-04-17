import { Editor, Notice } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import { TextInputModal } from "./textInputModal";
import { runZendeskSnapshot } from "./snapshotCore";

export function createSnapshotByProductCommand(
	plugin: ZendeskTicketsPlugin,
) {
	return {
		id: "zendesk-snapshot-by-product",
		name: "Snapshot: Open Tickets by Product",
		editorCallback: (editor: Editor) => {
			const account = plugin.getAccountForQuery();
			if (!account) {
				new Notice("No Zendesk account configured.");
				return;
			}

			if (!plugin.settings.productFieldId) {
				new Notice(
					"Product field ID is not configured. Go to Settings → Zendesk Tickets → Product Field ID.",
				);
				return;
			}

			new TextInputModal(
				plugin.app,
				"Snapshot: Open Tickets by Product",
				"Enter product name",
				async (product: string) => {
					try {
						const { markdown } = await runZendeskSnapshot(
							plugin,
							"product",
							product,
						);
						editor.replaceSelection(markdown);
					} catch (err) {
						new Notice(
							`Snapshot failed: ${err instanceof Error ? err.message : String(err)}`,
						);
					}
				},
			).open();
		},
	};
}
