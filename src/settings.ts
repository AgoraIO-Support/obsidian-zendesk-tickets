import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import type ZendeskTicketsPlugin from "./main";
import {
	IZendeskSettings,
	IZendeskAccount,
	DEFAULT_ACCOUNT,
	EAuthenticationType,
} from "./interfaces/settingsInterfaces";

export class ZendeskSettingTab extends PluginSettingTab {
	private readonly _plugin: ZendeskTicketsPlugin;

	constructor(app: App, plugin: ZendeskTicketsPlugin) {
		super(app, plugin);
		this._plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Zendesk Tickets Settings" });

		// --- General Settings ---
		containerEl.createEl("h3", { text: "General" });

		new Setting(containerEl)
			.setName("Cache duration")
			.setDesc("How long to cache API responses (e.g. 15m, 1h, 30s)")
			.addText((text) =>
				text
					.setPlaceholder("15m")
					.setValue(this._plugin.settings.cacheTime)
					.onChange(async (value) => {
						await this._plugin.updateSettings({
							...this._plugin.settings,
							cacheTime: value,
						});
					})
			);

		new Setting(containerEl)
			.setName("Search results limit")
			.setDesc("Maximum number of tickets returned per search")
			.addText((text) =>
				text
					.setPlaceholder("25")
					.setValue(String(this._plugin.settings.searchResultsLimit))
					.onChange(async (value) => {
						const num = parseInt(value, 10);
						if (!isNaN(num) && num > 0) {
							await this._plugin.updateSettings({
								...this._plugin.settings,
								searchResultsLimit: num,
							});
						}
					})
			);

		new Setting(containerEl)
			.setName("Inline ticket prefix")
			.setDesc("Prefix for inline ticket references (e.g. ZD:12345)")
			.addText((text) =>
				text
					.setPlaceholder("ZD:")
					.setValue(this._plugin.settings.inlineTicketPrefix)
					.onChange(async (value) => {
						await this._plugin.updateSettings({
							...this._plugin.settings,
							inlineTicketPrefix: value,
						});
					})
			);

		new Setting(containerEl)
			.setName("Show color band")
			.setDesc("Show a colored stripe to identify multi-account tickets")
			.addToggle((toggle) =>
				toggle
					.setValue(this._plugin.settings.showColorBand)
					.onChange(async (value) => {
						await this._plugin.updateSettings({
							...this._plugin.settings,
							showColorBand: value,
						});
					})
			);

		new Setting(containerEl)
			.setName("Debug logging")
			.setDesc("Log API requests and responses to the developer console (Ctrl+Shift+I)")
			.addToggle((toggle) =>
				toggle
					.setValue(this._plugin.settings.debugLogging)
					.onChange(async (value) => {
						await this._plugin.updateSettings({
							...this._plugin.settings,
							debugLogging: value,
						});
					})
			);

		// --- Accounts ---
		containerEl.createEl("h3", { text: "Accounts" });

		this._plugin.settings.accounts.forEach((account, index) => {
			this._renderAccountSettings(containerEl, account, index);
		});

		new Setting(containerEl).addButton((button) =>
			button
				.setButtonText("Add Account")
				.setCta()
				.onClick(async () => {
					await this._plugin.updateSettings({
						...this._plugin.settings,
						accounts: [
							...this._plugin.settings.accounts,
							{ ...DEFAULT_ACCOUNT, priority: this._plugin.settings.accounts.length },
						],
					});
					this.display();
				})
		);
	}

	private _renderAccountSettings(
		containerEl: HTMLElement,
		account: IZendeskAccount,
		index: number
	): void {
		const accountEl = containerEl.createDiv({ cls: "zd-account-settings" });
		accountEl.createEl("h4", {
			text: account.alias || `Account ${index + 1}`,
		});

		new Setting(accountEl)
			.setName("Alias")
			.setDesc("Display name for this account")
			.addText((text) =>
				text
					.setPlaceholder("My Zendesk")
					.setValue(account.alias)
					.onChange(async (value) => {
						await this._updateAccount(index, { ...account, alias: value });
					})
			);

		new Setting(accountEl)
			.setName("Subdomain")
			.setDesc("Your Zendesk subdomain (e.g. 'mycompany' for mycompany.zendesk.com)")
			.addText((text) =>
				text
					.setPlaceholder("mycompany")
					.setValue(account.subdomain)
					.onChange(async (value) => {
						await this._updateAccount(index, { ...account, subdomain: value });
					})
			);

		new Setting(accountEl)
			.setName("Username")
			.setDesc("Your Zendesk display name or email — used in 'My Tickets' queries instead of 'me'")
			.addText((text) =>
				text
					.setPlaceholder("john.doe@example.com")
					.setValue(account.username)
					.onChange(async (value) => {
						await this._updateAccount(index, { ...account, username: value });
					})
			);

		new Setting(accountEl)
			.setName("Authentication type")
			.addDropdown((dropdown) =>
				dropdown
					.addOption(EAuthenticationType.EMAIL_TOKEN, "Email + API Token")
					.addOption(EAuthenticationType.OAUTH, "OAuth Token")
					.setValue(account.authenticationType)
					.onChange(async (value) => {
						await this._updateAccount(index, {
							...account,
							authenticationType: value as EAuthenticationType,
						});
						this.display();
					})
			);

		if (account.authenticationType === EAuthenticationType.EMAIL_TOKEN) {
			new Setting(accountEl)
				.setName("Email")
				.addText((text) =>
					text
						.setPlaceholder("user@example.com")
						.setValue(account.email)
						.onChange(async (value) => {
							await this._updateAccount(index, { ...account, email: value });
						})
				);

			new Setting(accountEl)
				.setName("API Token")
				.addText((text) =>
					text
						.setPlaceholder("Enter API token")
						.setValue(account.apiToken)
						.onChange(async (value) => {
							await this._updateAccount(index, { ...account, apiToken: value });
						})
				);
		} else {
			new Setting(accountEl)
				.setName("OAuth Token")
				.addText((text) =>
					text
						.setPlaceholder("Enter OAuth token")
						.setValue(account.oauthToken)
						.onChange(async (value) => {
							await this._updateAccount(index, { ...account, oauthToken: value });
						})
				);
		}

		new Setting(accountEl)
			.setName("Color")
			.setDesc("Identification color for this account")
			.addColorPicker((picker) =>
				picker.setValue(account.color).onChange(async (value) => {
					await this._updateAccount(index, { ...account, color: value });
				})
			);

		const buttonRow = new Setting(accountEl);

		buttonRow.addButton((button) =>
			button.setButtonText("Test Connection").onClick(async () => {
				const result = await this._plugin.client.testConnection(account);
				if (result.ok) {
					new Notice("Connection successful!");
				} else {
					new Notice(`Connection failed: ${result.error}`, 10000);
				}
			})
		);

		buttonRow.addButton((button) =>
			button
				.setButtonText("Remove")
				.setWarning()
				.onClick(async () => {
					const accounts = this._plugin.settings.accounts.filter(
						(_, i) => i !== index
					);
					await this._plugin.updateSettings({
						...this._plugin.settings,
						accounts,
					});
					this.display();
				})
		);
	}

	private async _updateAccount(
		index: number,
		updated: IZendeskAccount
	): Promise<void> {
		const accounts = this._plugin.settings.accounts.map((a, i) =>
			i === index ? updated : a
		);
		await this._plugin.updateSettings({
			...this._plugin.settings,
			accounts,
		});
	}
}
