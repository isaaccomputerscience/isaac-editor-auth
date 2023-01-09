# isaac-editor-auth
Github OAuth proxy for the content editor. Content editor is a frontend-only application and can therefore not safely store the client secret requried for the Github OAuth flow, so this server is used to fulfill this requirement.

## Configuration
The application reads from the following environment variables:
* `EDITOR_AUTH_CLIENT_SECRET`: The client secret of the Github OAuth application. (**required**)
* `EDITOR_AUTH_ALLOW_ORIGIN`: The value of the `Access-Control-Allow-Origin` response header. (default: `*`).
* `EDITOR_AUTH_PORT`: The port for the server to listen on. (default: `8080`)

## Running
```
EDITOR_AUTH_CLIENT_SECRET=<client_secret> npm run start
```
