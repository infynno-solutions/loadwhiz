/**
 * TanStack Start production server (Bun).
 * @see https://bun.com/docs/guides/ecosystem/tanstack-start
 */

import path from "node:path";

const SERVER_PORT = Number(process.env.PORT ?? 3000);
const CLIENT_DIRECTORY = "./dist/client";
const SERVER_ENTRY_POINT = "./dist/server/server.js";

const log = {
	info: (message: string) => console.log(`[INFO] ${message}`),
	success: (message: string) => console.log(`[SUCCESS] ${message}`),
	error: (message: string) => console.log(`[ERROR] ${message}`),
	header: (message: string) => console.log(`\n${message}\n`),
};

async function initializeStaticRoutes(clientDirectory: string) {
	const routes: Record<string, (req: Request) => Response | Promise<Response>> =
		{};

	try {
		const glob = new Bun.Glob("**/*");
		for await (const relativePath of glob.scan({ cwd: clientDirectory })) {
			const filepath = path.join(clientDirectory, relativePath);
			const route = `/${relativePath.split(path.sep).join(path.posix.sep)}`;
			const file = Bun.file(filepath);
			if (!(await file.exists()) || file.size === 0) continue;

			routes[route] = () =>
				new Response(file, {
					headers: {
						"Content-Type": file.type || "application/octet-stream",
						"Cache-Control": "public, max-age=31536000, immutable",
					},
				});
		}
	} catch (error) {
		log.error(`Failed to load static files: ${String(error)}`);
	}

	return routes;
}

async function initializeServer() {
	log.header("Starting Production Server");

	let handler: { fetch: (request: Request) => Response | Promise<Response> };
	try {
		const serverModule = (await import(SERVER_ENTRY_POINT)) as {
			default: { fetch: (request: Request) => Response | Promise<Response> };
		};
		handler = serverModule.default;
		log.success("TanStack Start handler initialized");
	} catch (error) {
		log.error(`Failed to load server handler: ${String(error)}`);
		process.exit(1);
	}

	const staticRoutes = await initializeStaticRoutes(CLIENT_DIRECTORY);

	const server = Bun.serve({
		hostname: process.env.HOST ?? "0.0.0.0",
		port: SERVER_PORT,
		routes: {
			...staticRoutes,
			"/*": (req: Request) => {
				try {
					return handler.fetch(req);
				} catch (error) {
					log.error(`Server handler error: ${String(error)}`);
					return new Response("Internal Server Error", { status: 500 });
				}
			},
		},
		error(error) {
			log.error(
				`Uncaught server error: ${error instanceof Error ? error.message : String(error)}`,
			);
			return new Response("Internal Server Error", { status: 500 });
		},
	});

	log.success(`Server listening on http://${server.hostname}:${String(server.port)}`);
}

initializeServer().catch((error: unknown) => {
	log.error(`Failed to start server: ${String(error)}`);
	process.exit(1);
});
