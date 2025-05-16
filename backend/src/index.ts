export interface Env {
	// 如果你在wrangler.toml中定义了绑定，在这里声明它们
	// 例如：
	// MY_KV_NAMESPACE: KVNamespace;
	// GAME_ROOM_DO: DurableObjectNamespace;
	// DB: D1Database;
	// MY_VARIABLE: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// 简单的CORS预检请求处理
		if (request.method === "OPTIONS") {
			return handleOptions(request);
		}

		// 路由示例
		if (url.pathname === "/api/hello") {
			const data = { message: "你好，来自斗地主后端 Worker！" };
			return new Response(JSON.stringify(data), {
				headers: {
					'Content-Type': 'application/json',
					...corsHeaders, // 添加CORS头部
				},
			});
		}

		if (url.pathname.startsWith("/api/game/")) {
			// 这里可以处理游戏相关的API请求
			// 例如: /api/game/create, /api/game/join/:roomId, /api/game/playCard
			return new Response(JSON.stringify({ error: "游戏API待实现" }), {
				status: 501, // Not Implemented
				headers: { 'Content-Type': 'application/json', ...corsHeaders },
			});
		}

		// 如果是WebSocket请求 (例如用于实时游戏通信)
		if (request.headers.get("Upgrade") === "websocket") {
			// TODO: 实现WebSocket逻辑，可能需要结合Durable Objects
			// const { 0: client, 1: server } = new WebSocketPair();
			// server.accept();
			// server.send(JSON.stringify({ message: "WebSocket连接已建立!" }));
			// server.addEventListener("message", event => {
			//   console.log("收到WebSocket消息:", event.data);
			//   server.send(JSON.stringify({ reply: `后端收到: ${event.data}`}));
			// });
			// return new Response(null, { status: 101, webSocket: client });
			return new Response(JSON.stringify({ error: "WebSocket待实现" }), {
				status: 501,
				headers: { 'Content-Type': 'application/json', ...corsHeaders },
			});
		}

		return new Response("路径未找到。", {
			status: 404,
			headers: { ...corsHeaders },
		});
	},
};

// CORS 头部 (根据需要调整来源)
const corsHeaders = {
	"Access-Control-Allow-Origin": "*", // 在生产环境中应更具体，例如 "https://your-game.pages.dev"
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization", // 添加你需要的头部
};

function handleOptions(request: Request) {
	if (
		request.headers.get("Origin") !== null &&
		request.headers.get("Access-Control-Request-Method") !== null &&
		request.headers.get("Access-Control-Request-Headers") !== null
	) {
		// 处理预检请求.
		return new Response(null, {
			headers: corsHeaders,
		});
	} else {
		// 处理实际的 OPTIONS 请求.
		return new Response(null, {
			headers: {
				Allow: "GET, POST, PUT, DELETE, OPTIONS",
			},
		});
	}
}
