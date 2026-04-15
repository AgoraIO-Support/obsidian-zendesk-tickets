import { App, Editor, Modal, Notice, Setting } from "obsidian";
import type ZendeskTicketsPlugin from "../main";

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

class InsertTicketModal extends Modal {
	private readonly _plugin: ZendeskTicketsPlugin;
	private readonly _onSubmit: (text: string) => void;
	private _ticketId = "";
	private _selectedFormat = "inline";

	constructor(
		app: App,
		plugin: ZendeskTicketsPlugin,
		onSubmit: (text: string) => void,
	) {
		super(app);
		this._plugin = plugin;
		this._onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("h3", { text: "Insert Zendesk Ticket" });

		// Ticket ID input
		new Setting(contentEl).setName("Ticket ID").addText((text) => {
			text.setPlaceholder("e.g. 12345");
			text.onChange((value) => {
				this._ticketId = value;
			});
			text.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
				if (e.key === "Enter") {
					e.preventDefault();
					this._submit();
				}
			});
			setTimeout(() => text.inputEl.focus(), 10);
		});

		// Format selection as radio-style buttons
		const formatSetting = new Setting(contentEl).setName("Format");
		formatSetting.controlEl.empty();

		const radioContainer = formatSetting.controlEl.createDiv({
			cls: "zendesk-format-radios",
		});

		for (const format of FORMATS) {
			const label = radioContainer.createEl("label", {
				cls: "zendesk-format-option",
			});
			const radio = label.createEl("input", {
				type: "radio",
				attr: { name: "zendesk-format", value: format.key },
			}) as HTMLInputElement;
			if (format.key === this._selectedFormat) {
				radio.checked = true;
			}
			radio.addEventListener("change", () => {
				this._selectedFormat = format.key;
			});
			const textSpan = label.createEl("span");
			textSpan.createEl("strong", { text: format.label });
			textSpan.createEl("br");
			textSpan.createEl("small", {
				text: format.description,
				cls: "u-muted",
			});
		}

		new Setting(contentEl).addButton((btn) => {
			btn.setButtonText("Insert")
				.setCta()
				.onClick(() => this._submit());
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private _submit(): void {
		const id = this._ticketId.trim();
		if (id.length === 0) return;

		const text = buildInsertText(
			this._selectedFormat,
			id,
			this._plugin,
		);
		if (text) {
			this.close();
			this._onSubmit(text);
		}
	}
}

export function createInsertTicketCommand(plugin: ZendeskTicketsPlugin) {
	return {
		id: "zendesk-insert-ticket",
		name: "Insert Ticket",
		editorCallback: (editor: Editor) => {
			new InsertTicketModal(plugin.app, plugin, (text) => {
				editor.replaceSelection(text);
			}).open();
		},
	};
}

function buildInsertText(
	format: string,
	ticketId: string,
	plugin: ZendeskTicketsPlugin,
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
