import { Notice } from "obsidian";
import type ZendeskTicketsPlugin from "../main";

export function createClearCacheCommand(plugin: ZendeskTicketsPlugin) {
	return {
		id: "zendesk-clear-cache",
		name: "Clear Cache",
		callback: () => {
			plugin.clearCache();
			new Notice("Zendesk cache cleared.");
		},
	};
}
