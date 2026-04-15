import { App, Modal, Setting } from "obsidian";

export class TextInputModal extends Modal {
	private readonly _title: string;
	private readonly _placeholder: string;
	private readonly _onSubmit: (value: string) => void;
	private _value = "";

	constructor(
		app: App,
		title: string,
		placeholder: string,
		onSubmit: (value: string) => void
	) {
		super(app);
		this._title = title;
		this._placeholder = placeholder;
		this._onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("h3", { text: this._title });

		new Setting(contentEl)
			.setName("")
			.addText((text) => {
				text.setPlaceholder(this._placeholder);
				text.onChange((value) => {
					this._value = value;
				});
				text.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
					if (e.key === "Enter") {
						e.preventDefault();
						this._submit();
					}
				});
				// Auto-focus the input
				setTimeout(() => text.inputEl.focus(), 10);
			});

		new Setting(contentEl).addButton((btn) => {
			btn.setButtonText("Submit")
				.setCta()
				.onClick(() => this._submit());
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private _submit(): void {
		const trimmed = this._value.trim();
		if (trimmed.length === 0) return;
		this.close();
		this._onSubmit(trimmed);
	}
}
