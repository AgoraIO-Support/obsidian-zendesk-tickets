import {
	ViewPlugin,
	ViewUpdate,
	DecorationSet,
	Decoration,
	EditorView,
	WidgetType,
	MatchDecorator,
} from "@codemirror/view";
import type ZendeskTicketsPlugin from "../main";
import { IZendeskTicket, STATUS_COLORS } from "../interfaces/ticketInterfaces";

class InlineTicketWidget extends WidgetType {
	private readonly _ticketId: number;
	private readonly _plugin: ZendeskTicketsPlugin;

	constructor(ticketId: number, plugin: ZendeskTicketsPlugin) {
		super();
		this._ticketId = ticketId;
		this._plugin = plugin;
	}

	eq(other: InlineTicketWidget): boolean {
		return this._ticketId === other._ticketId;
	}

	toDOM(): HTMLElement {
		const span = document.createElement("span");
		span.classList.add("zd-inline-widget");
		span.textContent = `#${this._ticketId}`;

		this._resolve(span);
		return span;
	}

	private async _resolve(el: HTMLElement): Promise<void> {
		try {
			const account = this._plugin.getAccountForQuery();
			if (!account) return;

			const ticket = await this._plugin.client.getTicket(account, this._ticketId);
			const statusColor = STATUS_COLORS[ticket.status] || "#87929d";

			el.empty();
			el.classList.add("zd-inline-resolved");

			const dot = el.createEl("span", {
				cls: "zd-status-dot",
				attr: { style: `background-color: ${statusColor}` },
			});

			const link = el.createEl("a", {
				cls: "zd-ticket-link",
				text: `#${ticket.id}`,
				href: `https://${account.subdomain}.zendesk.com/agent/tickets/${ticket.id}`,
			});

			el.createEl("span", {
				cls: "zd-ticket-subject-short",
				text: ticket.subject.length > 50
					? ticket.subject.slice(0, 50) + "..."
					: ticket.subject,
			});
		} catch {
			el.classList.add("zd-inline-error");
		}
	}
}

export function createInlineTicketViewPlugin(plugin: ZendeskTicketsPlugin) {
	const prefix = plugin.settings.inlineTicketPrefix.replace(
		/[.*+?^${}()|[\]\\]/g,
		"\\$&"
	);

	const decorator = new MatchDecorator({
		regexp: new RegExp(`${prefix}(\\d+)`, "g"),
		decoration: (match, _view, _pos) => {
			const ticketId = parseInt(match[1], 10);
			return Decoration.replace({
				widget: new InlineTicketWidget(ticketId, plugin),
			});
		},
	});

	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = decorator.createDeco(view);
			}

			update(update: ViewUpdate) {
				this.decorations = decorator.updateDeco(update, this.decorations);
			}
		},
		{
			decorations: (v) => v.decorations,
		}
	);
}
