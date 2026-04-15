import { Editor, Notice } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import { TextInputModal } from "./textInputModal";
import { formatSnapshotTable } from "./snapshotHelper";

export function createSnapshotByUserCommand(plugin: ZendeskTicketsPlugin) {
	return {
		id: "zendesk-snapshot-by-user",
		name: "Snapshot: Open Tickets by User",
		editorCallback: (editor: Editor) => {
			const account = plugin.getAccountForQuery();
			if (!account) {
				new Notice("No Zendesk account configured.");
				return;
			}

			const defaultUser = account.username || "";

			new TextInputModal(
				plugin.app,
				"Snapshot: Open Tickets by User",
				"Enter username",
				async (username: string) => {
					try {
						const query = `type:ticket status<solved assignee:${username}`;
						const response = await plugin.client.searchTickets(
							account,
							query,
							100,
						);
						const markdown = formatSnapshotTable(
							`assignee: ${username}`,
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
				defaultUser,
			).open();
		},
	};
}
