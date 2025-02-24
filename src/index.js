
import html from '../src/dash/index.html'
import upload from '../src/dash/upload.html'
import list from '../src/dash/list.html'
import instructions from '../src/dash/wiki.html'
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

const AUTH_REALM = 'r2ko-dav';

// Handle WebDAV requests (e.g., GET, PUT, PROPFIND)
const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "PUT, GET, PROPFIND, OPTIONS",
	"Access-Control-Allow-Headers": "Authorization, Depth, Content-Type",
};

function is_authorized(authorization_header, username, password) {
	// Extract the Base64-encoded part of the header
	const encodedCredentials = authorization_header.replace("Basic ", "");
	// Decode the credentials
	const decodedCredentials = atob(encodedCredentials);
	// Split into username and password
	const [providedUsername, providedPassword] = decodedCredentials.split(":");

	// Compare with expected values
	return providedUsername === username && providedPassword === password;
}

async function handleDeleteFile(request, env) {
	const url = new URL(request.url);
	const filePath = decodeURIComponent(url.pathname.slice(1)); // Remove leading slash

	try {
		await env.MY_BUCKET.delete(filePath);
		return new Response('File deleted successfully', { status: 200 });
	} catch (error) {
		return new Response('Failed to delete file', { status: 500 });
	}
}

async function handleMultpleUploads(request, env) {
	const formData = await request.formData();
	const results = [];
	for (const entry of formData.entries()) {
		const [fieldName, file] = entry;
		if (file instanceof File) {
			const filename = file.name;
			const extension = filename.split(".").pop().toLowerCase();
			const contentType = mimeTypes[extension] || mimeTypes.default;
			const data = await file.arrayBuffer();

			try {
				await env.MY_BUCKET.put(filename, data, { httpMetadata: { contentType } });
				results.push({ filename, status: "success", contentType });
			} catch (error) {
				console.log("wtf");
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

async function handleFileList(request, env) {
	// Handle directory listing (WebDAV-specific)
	const path = new URL(request.url).pathname;
	const prefix = path === "/" ? "" : path.slice(1); // Handle root path

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

	return new Response(xmlResponse, {
		headers: { "Content-Type": "application/xml" },
	});
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
			break;
	}
}

export default {
	async fetch(request, env, ctx) {
		// Extract the Authorization header
		const authorization_header = request.headers.get("Authorization") || "";

		const url = new URL(request.url);
		let path = url.pathname;

		// Check if the request is authorized
		if(path === '/') path ="/dash/instructions"
		if (
			path !== "/dash/instructions" &&
			request.method !== "OPTIONS" &&
			!is_authorized(authorization_header, env.USERNAME, env.PASSWORD)
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
					"Cache-Control": "public, max-age=3600"
				},
			});

		}
		
		if (request.method === 'DELETE') {
			return handleDeleteFile(request, env);
		}

		// Upload multiple files via POST /upload
		if (request.method === "POST" && path === "/upload") {
			return handleMultpleUploads(request, env)
		}
		if (request.method === "GET") {
			return handleGetFile(request, env)
		}
		if (request.method === "PROPFIND") {
			return handleFileList(request, env)
		}
		return new Response("Method not allowed", { status: 405, headers: corsHeaders });
	},
};