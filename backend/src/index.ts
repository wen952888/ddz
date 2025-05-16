// backend/src/index.js (通过 Cloudflare Quick Edit 修改)

const ALLOWED_ORIGIN_HTTP = 'http://66.9528.ip-ddns.com';
const ALLOWED_ORIGIN_HTTPS = 'https://66.9528.ip-ddns.com'; // Cloudflare Pages 优先使用 HTTPS

function getCorsHeaders(requestOrigin) {
    let allowOriginHeader = "*"; // 默认，或用于非预期来源
    if (requestOrigin) {
        if (requestOrigin === ALLOWED_ORIGIN_HTTP || requestOrigin === ALLOWED_ORIGIN_HTTPS) {
            allowOriginHeader = requestOrigin;
        }
    }
    return {
        "Access-Control-Allow-Origin": allowOriginHeader,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", // 确保POST也允许，为注册/登录准备
        "Access-Control-Allow-Headers": "Content-Type, Authorization", // 确保Content-Type允许，因为注册/登录会发送JSON
    };
}

function handleOptions(request) {
    const requestOrigin = request.headers.get("Origin");
    const cors = getCorsHeaders(requestOrigin);
    if (
        requestOrigin !== null &&
        request.headers.get("Access-Control-Request-Method") !== null &&
        request.headers.get("Access-control-request-headers") !== null // 注意这里可能是小写
    ) {
        return new Response(null, { headers: cors });
    } else {
        return new Response(null, { headers: { Allow: "GET, POST, PUT, DELETE, OPTIONS" } });
    }
}

async function handleFetch(request, env, ctx) {
    const url = new URL(request.url);
    const requestOrigin = request.headers.get("Origin");
    const cors = getCorsHeaders(requestOrigin);

    if (request.method === "OPTIONS") {
        return handleOptions(request);
    }

    // /api/hello 路由
    if (url.pathname === "/api/hello") {
        const data = { message: "你好，来自斗地主后端 Worker！(房间版)" }; // 可以改下消息区分
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json', ...cors },
        });
    }

    // +++++ 后端模拟：房间和注册API (非常简化) +++++
    // 这部分代码是为了让前端的模拟API调用有一个响应目标，实际功能非常有限
    if (url.pathname === "/api/room/create" && request.method === "POST") {
        const mockRoomId = Math.floor(100 + Math.random() * 900);
        return new Response(JSON.stringify({ roomId: String(mockRoomId), message: "房间创建成功 (模拟)" }), {
            headers: { 'Content-Type': 'application/json', ...cors },
        });
    }

    if (url.pathname === "/api/room/join" && request.method === "POST") {
        // let body;
        // try { body = await request.json(); } catch (e) { /* ignore */ }
        // const roomId = body ? body.roomId : null;
        // 简单模拟成功
        return new Response(JSON.stringify({ message: "加入房间成功 (模拟)" }), {
            headers: { 'Content-Type': 'application/json', ...cors },
        });
    }

    if (url.pathname === "/api/auth/register" && request.method === "POST") {
        // let body;
        // try { body = await request.json(); } catch (e) { /* ignore */ }
        // const username = body ? body.username : null;
        // if (username === "test") {
        //     return new Response(JSON.stringify({ error: "用户名已存在 (模拟)" }), { status: 400, headers: { 'Content-Type': 'application/json', ...cors }});
        // }
        return new Response(JSON.stringify({ message: "注册成功 (模拟)" }), {
            headers: { 'Content-Type': 'application/json', ...cors },
        });
    }

    if (url.pathname === "/api/auth/login" && request.method === "POST") {
        // let body;
        // try { body = await request.json(); } catch (e) { /* ignore */ }
        // const username = body ? body.username : null;
        // if (username === "test") {
        //     return new Response(JSON.stringify({ username: "test", token: "fake-jwt-token", message: "登录成功 (模拟)" }), {
        //         headers: { 'Content-Type': 'application/json', ...cors },
        //     });
        // }
        // return new Response(JSON.stringify({ error: "用户名或密码错误 (模拟)" }), { status: 401, headers: { 'Content-Type': 'application/json', ...cors }});
         return new Response(JSON.stringify({ username: "mockUser", token: "fake-jwt-token", message: "登录成功 (模拟)" }), {
             headers: { 'Content-Type': 'application/json', ...cors },
         });
    }
    // ++++++++++++++++++++++++++++++++++++++++++++++


    if (url.pathname.startsWith("/api/game/")) { /* ... (与之前相同) ... */ }
    if (request.headers.get("Upgrade") === "websocket") { /* ... (与之前相同) ... */ }

    return new Response("路径未找到。", {
        status: 404,
        headers: { ...cors },
    });
}

addEventListener('fetch', event => {
  event.respondWith(handleFetch(event.request, globalThis, event));
});
