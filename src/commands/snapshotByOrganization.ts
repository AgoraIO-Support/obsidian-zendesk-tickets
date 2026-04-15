import { Editor, Notice } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import { TextInputModal } from "./textInputModal";
import { formatSnapshotTable } from "./snapshotHelper";

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
				"Enter organization name",
				async (orgName: string) => {
					try {
						const query = `type:ticket status<solved organization:${orgName}`;
						const response = await plugin.client.searchTickets(
							account,
							query,
							100,
						);
						const markdown = formatSnapshotTable(
							`organization: ${orgName}`,
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
