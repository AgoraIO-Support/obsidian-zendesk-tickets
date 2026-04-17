import { Notice, ObsidianProtocolData } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import {
	ZENDESK_SNAPSHOT_TYPES,
	ZendeskSnapshotType,
	appendSnapshotToFile,
	runZendeskSnapshot,
} from "./snapshotCore";

function isValidType(type: string): type is ZendeskSnapshotType {
	return (ZENDESK_SNAPSHOT_TYPES as readonly string[]).includes(type);
}

export function createZendeskSnapshotUriHandler(plugin: ZendeskTicketsPlugin) {
	return async (params: ObsidianProtocolData): Promise<void> => {
		const { type, value, target } = params;
		if (!type || !target) {
			new Notice("Zendesk: URI requires `type` and `target` params");
			return;
		}
		if (!isValidType(type)) {
			new Notice(
				`Zendesk: invalid type "${type}" — expected ${ZENDESK_SNAPSHOT_TYPES.join("|")}`,
			);
			return;
		}
		// `value` is not required for newLastWeek
		if (type !== "newLastWeek" && !value) {
			new Notice(`Zendesk: type "${type}" requires a value`);
			return;
		}

		try {
			new Notice(`Zendesk: Fetching ${type}${value ? `=${value}` : ""}...`);
			const { markdown, count } = await runZendeskSnapshot(
				plugin,
				type,
				value ?? "",
			);
			await appendSnapshotToFile(plugin.app, target, markdown);
			new Notice(`Zendesk: Appended ${count} tickets to ${target}`);
		} catch (err) {
			console.error("Zendesk URI snapshot error:", err);
			new Notice(
				`Zendesk: ${err instanceof Error ? err.message : String(err)}`,
				8000,
			);
		}
	};
}
