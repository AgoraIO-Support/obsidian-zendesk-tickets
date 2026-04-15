import { Editor, Notice } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import { TextInputModal } from "./textInputModal";
import { formatSnapshotTable } from "./snapshotHelper";

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

			new TextInputModal(
				plugin.app,
				"Snapshot: Open Tickets by Product",
				"Enter product name (tag)",
				async (product: string) => {
					try {
						const query = `type:ticket status<solved tags:${product}`;
						const response = await plugin.client.searchTickets(
							account,
							query,
							100,
						);
						const markdown = formatSnapshotTable(
							`product: ${product}`,
							response.results,
							account,
							new Date(),
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
