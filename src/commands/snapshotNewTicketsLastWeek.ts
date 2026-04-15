import { Editor, Notice } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import { formatDate, formatDateTime } from "./snapshotHelper";

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
				const now = new Date();
				const sevenDaysAgo = new Date(
					now.getFullYear(),
					now.getMonth(),
					now.getDate() - 7,
				);
				const startDate = formatDate(sevenDaysAgo);
				const endDate = formatDate(now);
				const timestamp = formatDateTime(now);

				const query = `type:ticket created>${startDate}`;
				const response = await plugin.client.searchTickets(
					account,
					query,
					100,
				);

				const markdown = [
					`## New Tickets \u2014 ${startDate} ~ ${endDate}`,
					"",
					`**${response.count}** new tickets created in the past 7 days.`,
					"",
					`_Captured at ${timestamp}_`,
					"",
				].join("\n");

				editor.replaceSelection(markdown);
			} catch (err) {
				new Notice(
					`Snapshot failed: ${err instanceof Error ? err.message : String(err)}`,
				);
			}
		},
	};
}
