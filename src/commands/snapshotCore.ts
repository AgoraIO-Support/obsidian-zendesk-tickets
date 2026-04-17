import { App, TFile } from "obsidian";
import type ZendeskTicketsPlugin from "../main";
import { formatSnapshotTable, formatDate, formatDateTime } from "./snapshotHelper";

export type ZendeskSnapshotType =
	| "user"
	| "organization"
	| "product"
	| "newLastWeek";

export const ZENDESK_SNAPSHOT_TYPES: readonly ZendeskSnapshotType[] = [
	"user",
	"organization",
	"product",
	"newLastWeek",
];

export interface ZendeskSnapshotResult {
	readonly markdown: string;
	readonly count: number;
	readonly title: string;
}

export async function runZendeskSnapshot(
	plugin: ZendeskTicketsPlugin,
	type: ZendeskSnapshotType,
	value: string,
): Promise<ZendeskSnapshotResult> {
	const account = plugin.getAccountForQuery();
	if (!account) {
		throw new Error("No Zendesk account configured.");
	}

	const capturedAt = new Date();

	switch (type) {
		case "user": {
			if (!value) throw new Error("username is required");
			const query = `type:ticket status<solved assignee:${value}`;
			const response = await plugin.client.searchTickets(account, query, 100);
			const markdown = formatSnapshotTable(
				`assignee: ${value}`,
				response.results,
				account,
				capturedAt,
			);
			return { markdown, count: response.results.length, title: `assignee: ${value}` };
		}
		case "organization": {
			if (!value) throw new Error("organization name or company id is required");
			const orgIds = await plugin.client.findOrganizationIds(account, value);
			if (orgIds.length === 0) {
				throw new Error(`No organizations found matching "${value}"`);
			}
			const response = await plugin.client.searchTicketsByOrgIds(
				account,
				orgIds,
				"status<solved",
				100,
			);
			const markdown = formatSnapshotTable(
				`organization: ${value}`,
				response.results,
				account,
				capturedAt,
			);
			return { markdown, count: response.results.length, title: `organization: ${value}` };
		}
		case "product": {
			if (!value) throw new Error("product name is required");
			const fieldId = plugin.settings.productFieldId;
			if (!fieldId) {
				throw new Error(
					"Product field ID is not configured. Settings → Zendesk Tickets → Product Field ID.",
				);
			}
			const query = `type:ticket status<solved custom_field_${fieldId}:${value}`;
			const response = await plugin.client.searchTickets(account, query, 100);
			const markdown = formatSnapshotTable(
				`product: ${value}`,
				response.results,
				account,
				capturedAt,
			);
			return { markdown, count: response.results.length, title: `product: ${value}` };
		}
		case "newLastWeek": {
			const sevenDaysAgo = new Date(
				capturedAt.getFullYear(),
				capturedAt.getMonth(),
				capturedAt.getDate() - 7,
			);
			const startDate = formatDate(sevenDaysAgo);
			const endDate = formatDate(capturedAt);
			const timestamp = formatDateTime(capturedAt);
			const query = `type:ticket created>${startDate}`;
			const response = await plugin.client.searchTickets(account, query, 100);
			const markdown = [
				`## New Tickets \u2014 ${startDate} ~ ${endDate}`,
				"",
				`**${response.count}** new tickets created in the past 7 days.`,
				"",
				`_Captured at ${timestamp}_`,
				"",
			].join("\n");
			return { markdown, count: response.count, title: `new tickets ${startDate}~${endDate}` };
		}
	}
}

export async function appendSnapshotToFile(
	app: App,
	targetPath: string,
	markdown: string,
): Promise<void> {
	const file = app.vault.getAbstractFileByPath(targetPath);
	if (!file || !(file instanceof TFile)) {
		throw new Error(`Target file not found: ${targetPath}`);
	}
	const existing = await app.vault.read(file);
	const separator =
		existing.length === 0 || existing.endsWith("\n\n")
			? ""
			: existing.endsWith("\n")
				? "\n"
				: "\n\n";
	const next = existing + separator + markdown + "\n";
	await app.vault.modify(file, next);
}
