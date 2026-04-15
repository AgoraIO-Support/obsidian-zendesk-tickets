import { Editor, Notice, SuggestModal, App } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import { TextInputModal } from "./textInputModal";

interface InsertFormat {
	readonly label: string;
	readonly description: string;
	readonly key: string;
}

const FORMATS: readonly InsertFormat[] = [
	{ key: "inline", label: "Inline reference", description: "ZD:12345 — renders dynamically in text" },
	{ key: "link", label: "Markdown link", description: "[ZD#12345](url) — static clickable link" },
	{ key: "block", label: "Ticket block", description: "```zendesk-ticket``` — dynamic card" },
];

class FormatPickerModal extends SuggestModal<InsertFormat> {
	private _onSelect: (format: InsertFormat) => void;

	constructor(app: App, onSelect: (format: InsertFormat) => void) {
		super(app);
		this._onSelect = onSelect;
		this.setPlaceholder("Pick insert format");
	}

	getSuggestions(query: string): InsertFormat[] {
		const q = query.toLowerCase();
		return FORMATS.filter(
			(f) =>
				f.label.toLowerCase().includes(q) ||
				f.description.toLowerCase().includes(q)
		);
	}

	renderSuggestion(item: InsertFormat, el: HTMLElement): void {
		el.createEl("div", { text: item.label });
		el.createEl("small", { text: item.description, cls: "u-muted" });
	}

	onChooseSuggestion(item: InsertFormat): void {
		this._onSelect(item);
	}
}

export function createInsertTicketCommand(plugin: ZendeskTicketsPlugin) {
	return {
		id: "zendesk-insert-ticket",
		name: "Insert Ticket",
		editorCallback: (editor: Editor) => {
			new TextInputModal(
				plugin.app,
				"Insert Zendesk Ticket",
				"Enter ticket ID (e.g. 12345)",
				(ticketId: string) => {
					new FormatPickerModal(plugin.app, (format) => {
						const text = buildInsertText(
							format.key,
							ticketId,
							plugin
						);
						if (text) {
							editor.replaceSelection(text);
						}
					}).open();
				}
			).open();
		},
	};
}

function buildInsertText(
	format: string,
	ticketId: string,
	plugin: ZendeskTicketsPlugin
): string | null {
	switch (format) {
		case "inline":
			return `${plugin.settings.inlineTicketPrefix}${ticketId}`;
		case "link": {
			const account = plugin.getAccountForQuery();
			if (!account) {
				new Notice("No Zendesk account configured.");
				return null;
			}
			const url = `https://${account.subdomain}.zendesk.com/agent/tickets/${ticketId}`;
			return `[ZD#${ticketId}](${url})`;
		}
		case "block":
			return `\`\`\`zendesk-ticket\n${ticketId}\n\`\`\`\n`;
		default:
			return null;
	}
}
