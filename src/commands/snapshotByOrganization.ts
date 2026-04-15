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
				"Enter organization name, company ID, or company name",
				async (term: string) => {
					try {
						new Notice(`Searching organizations matching "${term}"...`);

						const orgIds = await plugin.client.findOrganizationIds(
							account,
							term,
						);

						if (orgIds.length === 0) {
							new Notice(
								`No organizations found matching "${term}"`,
								5000,
							);
							return;
						}

						new Notice(
							`Found ${orgIds.length} org(s), fetching tickets...`,
						);

						const response =
							await plugin.client.searchTicketsByOrgIds(
								account,
								orgIds,
								"status<solved",
								100,
							);

						const markdown = formatSnapshotTable(
							`organization: ${term}`,
							response.results,
							account,
							new Date(),
						);
						editor.replaceSelection(markdown);
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
