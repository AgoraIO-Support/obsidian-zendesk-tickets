import type ZendeskTicketsPlugin from "../main";
import { createInsertTicketCommand } from "./insertTicket";
import { createSearchTicketsCommand } from "./searchTickets";
import { createInsertInlineTicketCommand } from "./insertInlineTicket";
import { createMyOpenTicketsCommand } from "./myOpenTickets";
import { createMyPendingTicketsCommand } from "./myPendingTickets";
import { createRecentTicketsCommand } from "./recentTickets";
import { createOpenInBrowserCommand } from "./openInBrowser";
import { createSearchByTagCommand } from "./searchByTag";
import { createSearchByRequesterCommand } from "./searchByRequester";
import { createClearCacheCommand } from "./clearCache";
import { createInsertTicketLinkCommand } from "./insertTicketLink";

export function registerCommands(plugin: ZendeskTicketsPlugin): void {
	const commands = [
		createInsertTicketCommand(plugin),
		createSearchTicketsCommand(plugin),
		createInsertInlineTicketCommand(plugin),
		createMyOpenTicketsCommand(),
		createMyPendingTicketsCommand(),
		createRecentTicketsCommand(),
		createOpenInBrowserCommand(plugin),
		createSearchByTagCommand(plugin),
		createSearchByRequesterCommand(plugin),
		createClearCacheCommand(plugin),
		createInsertTicketLinkCommand(plugin),
	];

	for (const command of commands) {
		plugin.addCommand(command);
	}
}
