import { Editor, Notice } from "obsidian";
import type ZendeskTicketsPlugin from "../main";

export function createListTicketFieldsCommand(plugin: ZendeskTicketsPlugin) {
	return {
		id: "zendesk-list-ticket-fields",
		name: "List Ticket Fields (find custom field IDs)",
		editorCallback: async (editor: Editor) => {
			const account = plugin.getAccountForQuery();
			if (!account) {
				new Notice("No Zendesk account configured");
				return;
			}

			new Notice("Fetching ticket fields...");

			try {
				const fields = await plugin.client.getTicketFields(account);
				const customFields = fields.filter(
					(f) => f.active && !["subject", "description", "status", "priority", "tickettype", "group", "assignee"].includes(f.type)
				);

				const lines = [
					`## Zendesk Custom Fields — ${account.subdomain}`,
					"",
					"| Field ID | Title | Type | Options |",
					"|----------|-------|------|---------|",
				];

				for (const field of customFields) {
					const options = field.custom_field_options
						? field.custom_field_options.map((o) => o.name).join(", ")
						: "-";
					const escapedTitle = field.title.replace(/\|/g, "\\|");
					const escapedOptions = options.replace(/\|/g, "\\|");
					lines.push(
						`| ${field.id} | ${escapedTitle} | ${field.type} | ${escapedOptions} |`
					);
				}

				lines.push("");
				lines.push(`_${customFields.length} custom fields · Fetched at ${new Date().toLocaleString()}_`);
				lines.push("");

				editor.replaceSelection(lines.join("\n"));
				new Notice(`Found ${customFields.length} custom fields`);
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				new Notice(`Failed to fetch fields: ${msg}`, 8000);
			}
		},
	};
}
