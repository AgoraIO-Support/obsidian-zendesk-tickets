import { requestUrl, RequestUrlParam, RequestUrlResponse } from "obsidian";
import {
	IZendeskAccount,
	EAuthenticationType,
} from "../interfaces/settingsInterfaces";
import {
	IZendeskTicket,
	IZendeskTicketField,
	IZendeskOrganization,
	IZendeskOrganizationSearchResponse,
	IZendeskSearchResponse,
	IZendeskTicketResponse,
} from "../interfaces/ticketInterfaces";
import { ObjectsCache } from "../cache";

export class ZendeskClient {
	private _cache: ObjectsCache;
	private _debug: boolean;

	constructor(cache: ObjectsCache, debug = false) {
		this._cache = cache;
		this._debug = debug;
	}

	private _log(message: string, ...args: unknown[]): void {
		if (this._debug) {
			console.log(`[Zendesk] ${message}`, ...args);
		}
	}

	private _logError(message: string, ...args: unknown[]): void {
		console.error(`[Zendesk] ${message}`, ...args);
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
		if (cached !== null) {
			this._log("Cache hit: %s", path);
			return cached;
		}

		this._log("Request: GET %s", urlStr);

		const requestParams: RequestUrlParam = {
			url: urlStr,
			method: "GET",
			headers: {
				...this._buildAuthHeaders(account),
				"Content-Type": "application/json",
			},
		};

		let response: RequestUrlResponse;
		try {
			response = await requestUrl(requestParams);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this._logError("Network error for %s: %s", urlStr, msg);
			throw new Error(`Network error connecting to Zendesk: ${msg}`);
		}

		this._log("Response: %d for %s", response.status, path);

		if (response.status === 401) {
			this._logError("Auth failed (401) - check email/token for subdomain: %s", account.subdomain);
			throw new Error(`Authentication failed (401) for ${account.subdomain}. Check email and API token.`);
		}
		if (response.status === 403) {
			this._logError("Forbidden (403) for %s", urlStr);
			throw new Error(`Access denied (403) for ${account.subdomain}. Check account permissions.`);
		}
		if (response.status === 404) {
			this._logError("Not found (404): %s", urlStr);
			throw new Error(`Not found (404): ${path}`);
		}
		if (response.status === 429) {
			this._logError("Rate limited (429) by %s", account.subdomain);
			throw new Error("Rate limited by Zendesk. Please wait and try again.");
		}
		if (response.status >= 400) {
			this._logError("API error %d for %s: %s", response.status, urlStr, JSON.stringify(response.json));
			throw new Error(`Zendesk API error ${response.status}: ${JSON.stringify(response.json)}`);
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

	/**
	 * Find organization IDs matching the input term.
	 * Matches against: org name, organization_fields.companyid, organization_fields.company_name.
	 */
	async findOrganizationIds(
		account: IZendeskAccount,
		term: string
	): Promise<readonly number[]> {
		this._log("Searching organizations for: %s", term);

		// 1) Search by name via Zendesk search API
		const searchResponse = await this._request<IZendeskOrganizationSearchResponse>(
			account,
			"/search.json",
			{ query: `type:organization "${term}"` }
		);
		const byName = searchResponse.results;
		this._log("Found %d orgs by name search", byName.length);

		// 2) Check organization_fields (companyid, company_name) for those not already matched
		//    Also do a broader search in case custom fields don't get indexed
		const allOrgsResponse = await this._request<{ organizations: IZendeskOrganization[] }>(
			account,
			"/organizations/autocomplete.json",
			{ name: term }
		);
		const byAutocomplete = allOrgsResponse.organizations;
		this._log("Found %d orgs by autocomplete", byAutocomplete.length);

		// Merge and deduplicate
		const idSet = new Set<number>();
		const lowerTerm = term.toLowerCase();

		for (const org of [...byName, ...byAutocomplete]) {
			idSet.add(org.id);
		}

		// 3) Also search all results from name search for custom field matches
		//    For orgs returned by search, check organization_fields
		for (const org of byName) {
			if (org.organization_fields) {
				const fields = org.organization_fields;
				const companyId = String(fields.companyid ?? "").toLowerCase();
				const companyName = String(fields.company_name ?? "").toLowerCase();
				if (companyId.includes(lowerTerm) || companyName.includes(lowerTerm)) {
					idSet.add(org.id);
				}
			}
		}

		// 4) If we got few results, do a direct search for custom field values
		if (idSet.size === 0) {
			this._log("No results yet, trying custom field search");
			try {
				const fieldSearch = await this._request<IZendeskOrganizationSearchResponse>(
					account,
					"/search.json",
					{ query: `type:organization organization_fields.companyid:${term}` }
				);
				for (const org of fieldSearch.results) {
					idSet.add(org.id);
				}
			} catch {
				this._log("Custom field search failed, skipping");
			}
			try {
				const fieldSearch2 = await this._request<IZendeskOrganizationSearchResponse>(
					account,
					"/search.json",
					{ query: `type:organization organization_fields.company_name:${term}` }
				);
				for (const org of fieldSearch2.results) {
					idSet.add(org.id);
				}
			} catch {
				this._log("Custom field search (company_name) failed, skipping");
			}
		}

		const ids = [...idSet];
		this._log("Total matched org IDs: %o", ids);
		return ids;
	}

	/**
	 * Search tickets belonging to any of the given organization IDs.
	 */
	async searchTicketsByOrgIds(
		account: IZendeskAccount,
		orgIds: readonly number[],
		extraQuery: string,
		limit: number
	): Promise<IZendeskSearchResponse> {
		if (orgIds.length === 0) {
			return { results: [], count: 0, next_page: null, previous_page: null };
		}
		// Build OR query for multiple org IDs
		const orgFilter = orgIds.length === 1
			? `organization_id:${orgIds[0]}`
			: orgIds.map((id) => `organization_id:${id}`).join(" ");
		const query = `type:ticket ${extraQuery} ${orgFilter}`;
		return this.searchTickets(account, query, limit);
	}

	async getTicketFields(account: IZendeskAccount): Promise<readonly IZendeskTicketField[]> {
		const response = await this._request<{ ticket_fields: IZendeskTicketField[] }>(
			account,
			"/ticket_fields.json"
		);
		return response.ticket_fields;
	}

	async testConnection(account: IZendeskAccount): Promise<{ ok: boolean; error?: string }> {
		this._log("Testing connection to %s.zendesk.com ...", account.subdomain);
		try {
			await this._request(account, "/users/me.json");
			this._log("Connection successful for %s", account.subdomain);
			return { ok: true };
		} catch (e) {
			const error = e instanceof Error ? e.message : String(e);
			this._logError("Connection test failed for %s: %s", account.subdomain, error);
			return { ok: false, error };
		}
	}
}
