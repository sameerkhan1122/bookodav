
import html from '../src/public/dash/index.html'
import upload from '../src/public/dash/upload.html'
import list from '../src/public/dash/list.html'
import instructions from '../src/public/dash/wiki.html'
import notfoundpage from '../src/public/dash/404.html'
// MIME type mapping based on file extensions
const mimeTypes = {
	// Text & Books
	epub: "application/epub+zip",
	pdf: "application/pdf",
	mobi: "application/x-mobipocket-ebook",
	cbr: "application/x-cbr", // Comic Book RAR
	cbz: "application/x-cbz", // Comic Book ZIP

	// Images
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	gif: "image/gif",
	webp: "image/webp",

	// Fallback
	default: "application/octet-stream",
};

const AUTH_REALM = 'BOOKO-DAV';

// Handle WebDAV requests (e.g., GET, PUT, PROPFIND)
const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "PUT, GET, PROPFIND, OPTIONS",
	"Access-Control-Allow-Headers": "Authorization, Depth, Content-Type",
};

async function is_authorized(authorization_header, username, password) {
	const encoder = new TextEncoder();

	const header = encoder.encode(authorization_header);

	const expected = encoder.encode(`Basic ${btoa(`${username}:${password}`)}`);

	if (header.byteLength !== expected.byteLength) {
		return false; // Length mismatch
	}

	return await crypto.subtle.timingSafeEqual(header, expected)

}

async function handleDeleteFile(request, env, ctx) {
	const url = new URL(request.url);

	const filePath = decodeURIComponent(url.pathname.slice(1)); // Remove leading slash
	if (filePath.includes("..")) {
		return new Response("Invalid path", { status: 400 });
	}
	try {
		await env.MY_BUCKET.delete(filePath);

		// fetch(new URL("/", request.url), { // Target the root path
		// 	method: "PROPFIND",
		// 	headers: { "X-Bypass-Cache": "true" },
		// })

		return new Response('File deleted successfully', { status: 200 });
	} catch (error) {
		return new Response('Failed to delete file', { status: 500 });
	}
}

async function handleMultpleUploads(request, env, ctx) {
	const formData = await request.formData();
	const results = [];
	for (const entry of formData.entries()) {
		const [fieldName, file] = entry;
		if (file instanceof File) {
			const filename = file.name;
			const extension = filename.split(".").pop().toLowerCase();
			const contentType = mimeTypes[extension] || mimeTypes.default;
			const data = await file.arrayBuffer();
			const sanitizedFilename = filename.replace(/[^a-zA-Z0-9\-_.]/g, ""); //Sanitize filenames to prevent path traversal attacks.
			if (filename.includes("..")) { // Block path traversal
				return new Response("Invalid path", { status: 400 });
			}
			if (!sanitizedFilename) return new Response("Invalid filename", { status: 400 });
			try {
				await env.MY_BUCKET.put(sanitizedFilename, data, { httpMetadata: { contentType } });
				results.push({ sanitizedFilename, status: "success", contentType });
				//console.log(request.url)

				// fetch(new URL("/", request.url), { // Target the root path
				// 	method: "PROPFIND",
				// 	headers: { "X-Bypass-Cache": "true" },
				// })

			} catch (error) {
				//console.log("wtf");
				results.push({ filename, status: "failed", error: error.message });
			}
		}
	}

	return new Response(JSON.stringify(results), {
		headers: { ...corsHeaders, "Content-Type": "application/json" },
	});
}

async function handleGetFile(request, env) {
	const path = new URL(request.url).pathname;
	const filename = decodeURIComponent(path.slice(1));
	const file = await env.MY_BUCKET.get(filename);

	if (file === null) {
		return new Response("File not found", { status: 404, headers: corsHeaders });
	}

	const extension = filename.split(".").pop().toLowerCase();
	const contentType = mimeTypes[extension] || mimeTypes.default;

	return new Response(file.body, {
		headers: {
			...corsHeaders,
			"Content-Type": contentType,
			"Content-Disposition": `inline; filename="${filename}"`,
		},
	});
}

async function handleFileList(request, env, ctx) {
	// Handle directory listing (WebDAV-specific)
	const path = new URL(request.url).pathname;
	const prefix = path === "/" ? "" : path.slice(1); // Handle root path

	// const bypassCache = request.headers.get("X-Bypass-Cache") === "true";
	// const cache = caches.default;
	// const cacheKey = new Request(request.url, { cf: { cacheTtl: 604800 } });

	// if (!bypassCache) {
	// 	const cachedResponse = await cache.match(cacheKey);
	// 	if (cachedResponse) {
	// 		//console.log(`HIT`);
	// 		return cachedResponse;
	// 	}

	// }
	// console.log("MISS");




	// List objects in R2 with the correct prefix
	const objects = await env.MY_BUCKET.list({ prefix });

	// Generate WebDAV XML response
	const xmlResponse = `
	  <D:multistatus xmlns:D="DAV:">
		<D:response>
		  <D:href>${path}</D:href>
		  <D:propstat>
			<D:prop>
			  <D:resourcetype><D:collection/></D:resourcetype>
			  <D:displayname>${path === "/" ? "root" : path.split("/").pop()}</D:displayname>
			</D:prop>
			<D:status>HTTP/1.1 200 OK</D:status>
		  </D:propstat>
		</D:response>
		${objects.objects
			.map(
				(obj) => `
			  <D:response>
				<D:href>/${obj.key}</D:href>
				<D:propstat>
				  <D:prop>
					<D:resourcetype/> <!-- Empty for files -->
					<D:getcontentlength>${obj.size}</D:getcontentlength>
					<D:getlastmodified>${new Date(obj.uploaded).toUTCString()}</D:getlastmodified>
				  </D:prop>
				  <D:status>HTTP/1.1 200 OK</D:status>
				</D:propstat>
			  </D:response>
			`
			)
			.join("")}
	  </D:multistatus>
	`;

	const response = new Response(xmlResponse, {
		headers: {
			...corsHeaders,
			"Content-Type": "application/xml",
			"Cache-Control": "public, max-age=604800"
		},
	});
	//ctx.waitUntil(cache.put(cacheKey, response.clone()));
	return response;
}


function handleUiRouting(path) {

	switch (path) {
		case "/dash":
			return html
		case "/dash/upload":
			return upload
		case "/dash/list":
			return list
		case "/dash/instructions": // 👈 New route
			return instructions;
		default:
			return notfoundpage;
	}
}

export default {
	async fetch(request, env, ctx) {
		// Extract the Authorization header
		const authorization_header = request.headers.get("Authorization") || "";

		const url = new URL(request.url);
		let path = url.pathname;
		if (request.method === "GET" && path === "/favicon.ico") {
			// Fetch favicon from R2 bucket
			const favicon = './favicon.ico'

			if (!favicon) {
				return new Response("Favicon not found", { status: 404 });
			}

			return new Response(favicon.body, {
				headers: {
					"Content-Type": "image/x-icon",
					"Cache-Control": "public, max-age=604800" // 1 week
				}
			});
		}

		if (
			path !== "/dash/instructions" &&
			request.method !== "OPTIONS" &&
			!(await is_authorized(authorization_header, env.USERNAME, env.PASSWORD))
		) {
			// Return 401 Unauthorized if credentials are invalid
			return new Response("Unauthorized", {
				status: 401,
				headers: {
					"WWW-Authenticate": `Basic realm="${AUTH_REALM}"`,
				},
			});
		}


		// dashboard

		if (request.method === "GET" && path.includes("/dash")) {
			return new Response(handleUiRouting(path), {
				headers: {
					"Content-Type": "text/html",
					"Cache-Control": "public, max-age=604800"
				},
			});

		}

		if (request.method === 'DELETE') {
			return handleDeleteFile(request, env, ctx);
		}

		// Upload multiple files via POST /upload
		if (request.method === "POST" && path === "/upload") {
			return handleMultpleUploads(request, env, ctx)
		}
		if (request.method === "GET") {
			return handleGetFile(request, env, ctx)
		}
		if (request.method === "PROPFIND") {
			return handleFileList(request, env, ctx)
		}
		return new Response("Method not allowed", { status: 405, headers: corsHeaders });
	},
};