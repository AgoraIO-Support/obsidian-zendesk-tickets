# Obsidian Zendesk Tickets

Query and display Zendesk tickets inline in your Obsidian notes.

## Features

### Inline Ticket References
Type `ZD:12345` anywhere in your note to see a rendered ticket tag with status, ID, and subject.

### Fence Blocks

**Single ticket display:**
````
```zendesk-ticket
12345
67890
```
````

**Search query:**
````
```zendesk-search
query: status:open assignee:me
limit: 10
columns: ID, SUBJECT, STATUS, PRIORITY, UPDATED
account: MyZendesk
```
````

Search uses [Zendesk search syntax](https://support.zendesk.com/hc/en-us/articles/203663226).

### Supported Search Columns
ID, SUBJECT, STATUS, PRIORITY, TYPE, REQUESTER, ASSIGNEE, GROUP, CREATED, UPDATED, TAGS

## Setup

1. Install the plugin
2. Go to Settings → Zendesk Tickets
3. Add an account:
   - **Subdomain**: your Zendesk subdomain (e.g. `mycompany` for mycompany.zendesk.com)
   - **Auth**: Email + API Token (recommended) or OAuth
4. Click "Test Connection" to verify

### Getting an API Token
1. In Zendesk Admin → Apps and integrations → APIs → Zendesk API
2. Enable Token Access
3. Add API Token → copy the token

## Development

```bash
npm install
npm run dev    # watch mode
npm run build  # production build
```

## License

MIT
