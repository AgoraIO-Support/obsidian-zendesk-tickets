import { requestUrl, RequestUrlParam, RequestUrlResponse } from "obsidian";
import {
	IZendeskAccount,
	EAuthenticationType,
} from "../interfaces/settingsInterfaces";
import {
	IZendeskTicket,
	IZendeskSearchResponse,
	IZendeskTicketResponse,
} from "../interfaces/ticketInterfaces";
import { ObjectsCache } from "../cache";

export class ZendeskClient {
	private _cache: ObjectsCache;

	constructor(cache: ObjectsCache) {
		this._cache = cache;
	}

	private _buildBaseUrl(account: IZendeskAccount): string {
		return `https://${account.subdomain}.zendesk.com/api/v2`;
	}

	private _buildAuthHeaders(account: IZendeskAccount): Record<string, string> {
		switch (account.authenticationType) {
			case EAuthenticationType.EMAIL_TOKEN:
				return {
					Authorization:
						"Basic " +
						btoa(`${account.email}/token:${account.apiToken}`),
				};
			case EAuthenticationType.OAUTH:
				return {
					Authorization: `Bearer ${account.oauthToken}`,
				};
		}
	}

	private async _request<T>(
		account: IZendeskAccount,
		path: string,
		params?: Record<string, string>
	): Promise<T> {
		const baseUrl = this._buildBaseUrl(account);
		const url = new URL(`${baseUrl}${path}`);
		if (params) {
			for (const [key, value] of Object.entries(params)) {
				url.searchParams.set(key, value);
			}
		}

		const urlStr = url.toString();
		const cached = this._cache.get<T>(urlStr);
		if (cached !== null) return cached;

		const requestParams: RequestUrlParam = {
			url: urlStr,
			method: "GET",
			headers: {
				...this._buildAuthHeaders(account),
				"Content-Type": "application/json",
			},
		};

		const response: RequestUrlResponse = await requestUrl(requestParams);

		if (response.status === 401) {
			throw new Error("Authentication failed. Check your credentials.");
		}
		if (response.status === 403) {
			throw new Error("Access denied. Check your account permissions.");
		}
		if (response.status === 404) {
			throw new Error("Resource not found.");
		}
		if (response.status === 429) {
			throw new Error("Rate limited by Zendesk. Please wait and try again.");
		}
		if (response.status >= 400) {
			throw new Error(`Zendesk API error: ${response.status}`);
		}

		const data = response.json as T;
		this._cache.set(urlStr, data);
		return data;
	}

	async getTicket(
		account: IZendeskAccount,
		ticketId: number
	): Promise<IZendeskTicket> {
		const response = await this._request<IZendeskTicketResponse>(
			account,
			`/tickets/${ticketId}.json`
		);
		return response.ticket;
	}

	async searchTickets(
		account: IZendeskAccount,
		query: string,
		limit: number
	): Promise<IZendeskSearchResponse> {
		const fullQuery = query.includes("type:")
			? query
			: `type:ticket ${query}`;
		return this._request<IZendeskSearchResponse>(
			account,
			"/search.json",
			{
				query: fullQuery,
				per_page: String(Math.min(limit, 100)),
				sort_by: "updated_at",
				sort_order: "desc",
			}
		);
	}

	async testConnection(account: IZendeskAccount): Promise<boolean> {
		try {
			await this._request(account, "/users/me.json");
			return true;
		} catch {
			return false;
		}
	}
}
