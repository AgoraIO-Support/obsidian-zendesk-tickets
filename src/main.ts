import { Plugin } from "obsidian";
import {
	IZendeskSettings,
	IZendeskAccount,
	DEFAULT_SETTINGS,
} from "./interfaces/settingsInterfaces";
import { ZendeskClient } from "./client/zendeskClient";
import { ObjectsCache, parseCacheTime } from "./cache";
import { ZendeskSettingTab } from "./settings";
import { createTicketFenceRenderer } from "./rendering/ticketFenceRenderer";
import { createSearchFenceRenderer } from "./rendering/searchFenceRenderer";
import { createInlineTicketProcessor } from "./rendering/inlineTicketRenderer";
import { createInlineTicketViewPlugin } from "./rendering/inlineTicketViewPlugin";
import { registerCommands } from "./commands";
import { createZendeskSnapshotUriHandler } from "./commands/snapshotUriHandler";

export default class ZendeskTicketsPlugin extends Plugin {
	settings: IZendeskSettings = DEFAULT_SETTINGS;
	client: ZendeskClient = null!;
	private _cache: ObjectsCache = null!;

	async onload(): Promise<void> {
		await this._loadSettings();

		this._cache = new ObjectsCache(parseCacheTime(this.settings.cacheTime));
		this.client = new ZendeskClient(this._cache, this.settings.debugLogging);

		// Settings tab
		this.addSettingTab(new ZendeskSettingTab(this.app, this));

		// Fence code block processors
		this.registerMarkdownCodeBlockProcessor(
			"zendesk-ticket",
			createTicketFenceRenderer(this)
		);
		this.registerMarkdownCodeBlockProcessor(
			"zendesk-search",
			createSearchFenceRenderer(this)
		);

		// Inline ticket renderer (reading mode)
		this.registerMarkdownPostProcessor(
			createInlineTicketProcessor(this)
		);

		// Live preview (editor mode)
		this.registerEditorExtension(
			createInlineTicketViewPlugin(this)
		);

		// Slash commands
		registerCommands(this);

		// Obsidian URI protocol handler — lets agents invoke snapshots headlessly
		// obsidian://zendesk-snapshot?vault=VAULT&type=user|organization|product|newLastWeek&value=XXX&target=path/to/note.md
		this.registerObsidianProtocolHandler(
			"zendesk-snapshot",
			createZendeskSnapshotUriHandler(this)
		);
	}

	async updateSettings(newSettings: IZendeskSettings): Promise<void> {
		this.settings = newSettings;
		this._cache.setTtl(parseCacheTime(newSettings.cacheTime));
		this._cache.clear();
		this.client = new ZendeskClient(this._cache, newSettings.debugLogging);
		await this.saveData(newSettings);
	}

	getAccountForQuery(alias?: string): IZendeskAccount | null {
		if (alias) return this.getAccountByAlias(alias);

		const sorted = [...this.settings.accounts].sort(
			(a, b) => a.priority - b.priority
		);
		return sorted[0] || null;
	}

	getAccountByAlias(alias: string): IZendeskAccount | null {
		return (
			this.settings.accounts.find(
				(a) => a.alias.toLowerCase() === alias.toLowerCase()
			) || null
		);
	}

	clearCache(): void {
		this._cache.clear();
	}

	getAssigneeQuery(): string {
		const account = this.getAccountForQuery();
		const username = account?.username;
		return username ? `assignee:${username}` : "assignee:me";
	}

	private async _loadSettings(): Promise<void> {
		const data = await this.loadData();
		this.settings = { ...DEFAULT_SETTINGS, ...data };
	}
}
