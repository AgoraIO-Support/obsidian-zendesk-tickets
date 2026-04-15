import type ZendeskTicketsPlugin from "../main";
import { createInsertTicketCommand } from "./insertTicket";
import { createSearchTicketsCommand } from "./searchTickets";
import { createInsertInlineTicketCommand } from "./insertInlineTicket";
import { createMyOpenTicketsCommand } from "./myOpenTickets";
import { createAllOpenTicketsCommand } from "./recentTickets";
import { createOpenInBrowserCommand } from "./openInBrowser";
import { createSearchByOrganizationCommand } from "./searchByRequester";
import { createClearCacheCommand } from "./clearCache";
import { createInsertTicketLinkCommand } from "./insertTicketLink";
import { createSnapshotByUserCommand } from "./snapshotByUser";
import { createSnapshotNewTicketsLastWeekCommand } from "./snapshotNewTicketsLastWeek";
import { createSnapshotByOrganizationCommand } from "./snapshotByOrganization";
import { createSnapshotByProductCommand } from "./snapshotByProduct";

export function registerCommands(plugin: ZendeskTicketsPlugin): void {
	const commands = [
		createInsertTicketCommand(plugin),
		createSearchTicketsCommand(plugin),
		createInsertInlineTicketCommand(plugin),
		createMyOpenTicketsCommand(plugin),
		createAllOpenTicketsCommand(),
		createOpenInBrowserCommand(plugin),
		createSearchByOrganizationCommand(plugin),
		createClearCacheCommand(plugin),
		createInsertTicketLinkCommand(plugin),
		createSnapshotByUserCommand(plugin),
		createSnapshotNewTicketsLastWeekCommand(plugin),
		createSnapshotByOrganizationCommand(plugin),
		createSnapshotByProductCommand(plugin),
	];

	for (const command of commands) {
		plugin.addCommand(command);
	}
}
