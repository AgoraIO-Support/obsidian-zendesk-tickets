import { Editor, Notice } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import { TextInputModal } from "./textInputModal";

export function createSearchByOrganizationCommand(
	plugin: ZendeskTicketsPlugin,
) {
	return {
		id: "zendesk-search-by-organization",
		name: "Search by Organization",
		editorCallback: (editor: Editor) => {
			const account = plugin.getAccountForQuery();
			if (!account) {
				new Notice("No Zendesk account configured.");
				return;
			}

			new TextInputModal(
				plugin.app,
				"Search Tickets by Organization",
				"Enter organization name, company ID, or company name",
				async (term: string) => {
					try {
						new Notice(
							`Searching organizations matching "${term}"...`,
						);

						const orgIds =
							await plugin.client.findOrganizationIds(
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

						// Build a fence block with resolved org IDs
						const orgFilter =
							orgIds.length === 1
								? `organization_id:${orgIds[0]}`
								: orgIds
										.map((id) => `organization_id:${id}`)
										.join(" ");
						const block = `\`\`\`zendesk-search\nquery: type:ticket ${orgFilter}\n\`\`\`\n`;
						editor.replaceSelection(block);
					} catch (err) {
						new Notice(
							`Search failed: ${err instanceof Error ? err.message : String(err)}`,
							8000,
						);
					}
				},
			).open();
		},
	};
}
