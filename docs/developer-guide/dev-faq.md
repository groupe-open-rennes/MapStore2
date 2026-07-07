# FAQ

## Troubleshooting

### Autowatch doesn't work on Linux

You should need to increase `max_user_watches` variable for inotify.

```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```

### Backend is running but the page is blank

If MapStore starts but the browser shows an empty page, check the following points in order:

1. Confirm frontend is reachable: [http://localhost:8081](http://localhost:8081)
2. Confirm backend is reachable: [http://localhost:8080/mapstore/](http://localhost:8080/mapstore/)
3. Make sure ports are not already used by other processes.
4. If you are using `npm start`, verify the frontend dev server is running together with backend.
5. If you run frontend and backend separately, verify proxy/backend target configuration and `MAPSTORE_BACKEND_URL`.
6. Check browser developer tools for failed requests (especially `configs/localConfig.json`, static assets, or 404/500 responses).
7. Check backend logs (embedded Tomcat / local Tomcat) for startup or runtime errors.

Useful references:

* [Quick Setup and Run](index.md#quick-setup-and-run)
* [Developing and Debugging - Backend](developing.md#backend)

## Other References

* [How to use a CDN](how-to-use-a-cdn.md#how-to-use-a-cdn)
