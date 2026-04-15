export enum EAuthenticationType {
	EMAIL_TOKEN = "EMAIL_TOKEN",
	OAUTH = "OAUTH",
}

export interface IZendeskAccount {
	readonly alias: string;
	readonly subdomain: string;
	readonly authenticationType: EAuthenticationType;
	readonly email: string;
	readonly apiToken: string;
	readonly oauthToken: string;
	readonly priority: number;
	readonly color: string;
}

export interface ISearchColumn {
	readonly type: ESearchColumnType;
	readonly compact: boolean;
}

export enum ESearchColumnType {
	ID = "ID",
	SUBJECT = "SUBJECT",
	STATUS = "STATUS",
	PRIORITY = "PRIORITY",
	TYPE = "TYPE",
	REQUESTER = "REQUESTER",
	ASSIGNEE = "ASSIGNEE",
	GROUP = "GROUP",
	CREATED = "CREATED",
	UPDATED = "UPDATED",
	TAGS = "TAGS",
}

export interface IZendeskSettings {
	readonly accounts: readonly IZendeskAccount[];
	readonly cacheTime: string;
	readonly searchResultsLimit: number;
	readonly inlineTicketPrefix: string;
	readonly showColorBand: boolean;
	readonly searchColumns: readonly ISearchColumn[];
	readonly debugLogging: boolean;
}

export const DEFAULT_ACCOUNT: IZendeskAccount = {
	alias: "",
	subdomain: "",
	authenticationType: EAuthenticationType.EMAIL_TOKEN,
	email: "",
	apiToken: "",
	oauthToken: "",
	priority: 0,
	color: "#4db5c4",
};

export const DEFAULT_SETTINGS: IZendeskSettings = {
	accounts: [],
	cacheTime: "15m",
	searchResultsLimit: 25,
	inlineTicketPrefix: "ZD:",
	showColorBand: false,
	searchColumns: [
		{ type: ESearchColumnType.ID, compact: false },
		{ type: ESearchColumnType.SUBJECT, compact: false },
		{ type: ESearchColumnType.STATUS, compact: false },
		{ type: ESearchColumnType.PRIORITY, compact: false },
		{ type: ESearchColumnType.ASSIGNEE, compact: false },
		{ type: ESearchColumnType.UPDATED, compact: false },
	],
	debugLogging: false,
};
