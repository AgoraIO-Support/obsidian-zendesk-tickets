import type ZendeskTicketsPlugin from "../main";
import { createInsertTicketCommand } from "./insertTicket";
import { createSearchTicketsCommand } from "./searchTickets";
import { createMyOpenTicketsCommand } from "./myOpenTickets";
import { createAllOpenTicketsCommand } from "./recentTickets";
import { createSearchByOrganizationCommand } from "./searchByRequester";
import { createClearCacheCommand } from "./clearCache";
import { createSnapshotByUserCommand } from "./snapshotByUser";
import { createSnapshotNewTicketsLastWeekCommand } from "./snapshotNewTicketsLastWeek";
import { createSnapshotByOrganizationCommand } from "./snapshotByOrganization";
import { createSnapshotByProductCommand } from "./snapshotByProduct";
import { createListTicketFieldsCommand } from "./listTicketFields";

export function registerCommands(plugin: ZendeskTicketsPlugin): void {
	const commands = [
		createInsertTicketCommand(plugin),
		createSearchTicketsCommand(plugin),
		createMyOpenTicketsCommand(plugin),
		createAllOpenTicketsCommand(),
		createSearchByOrganizationCommand(plugin),
		createClearCacheCommand(plugin),
		createSnapshotByUserCommand(plugin),
		createSnapshotNewTicketsLastWeekCommand(plugin),
		createSnapshotByOrganizationCommand(plugin),
		createSnapshotByProductCommand(plugin),
		createListTicketFieldsCommand(plugin),
	];

	for (const command of commands) {
		plugin.addCommand(command);
	}
}
