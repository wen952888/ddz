// backend/src/index.js

// --- CORS 配置 ---
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
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization", // 确保Content-Type允许
    };
}

function handleOptions(request) {
    const requestOrigin = request.headers.get("Origin");
    const cors = getCorsHeaders(requestOrigin);
    if (
        requestOrigin !== null &&
        request.headers.get("Access-Control-Request-Method") !== null &&
        request.headers.get("Access-Control-Request-Headers") !== null // 确保这个是小写或检查实际发送的头部
    ) {
        return new Response(null, { headers: cors });
    } else {
        return new Response(null, { headers: { Allow: "GET, POST, PUT, DELETE, OPTIONS" } });
    }
}

// --- 辅助函数 ---
// 密码哈希辅助函数 (示例：使用 SHA-256，生产环境应使用更安全的算法如 Argon2id)
async function hashPassword(password) {
    if (typeof crypto === 'undefined' || !crypto.subtle || !crypto.subtle.digest) {
        console.error("Web Crypto API not available in this environment for hashing.");
        // 在不支持的环境中，你可能需要一个不同的策略或返回一个错误
        // 为了演示，我们返回一个固定值，但这非常不安全
        return "crypto_unavailable_fallback_hash_" + password;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// UUID 生成函数 (简易版，用于PK)
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// --- 主 Fetch Handler ---
async function handleFetch(request, env, ctx) {
    const url = new URL(request.url);
    const requestOrigin = request.headers.get("Origin");
    const corsHeadersResponse = getCorsHeaders(requestOrigin); // 获取CORS头部以备后用

    if (request.method === "OPTIONS") {
        return handleOptions(request); // handleOptions内部会使用getCorsHeaders
    }

    // 检查D1数据库绑定是否存在
    if (!env || !env.DB) {
        console.error("D1 Database binding 'DB' is not configured in the worker environment.");
        return new Response(JSON.stringify({ error: "服务器数据库配置错误" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeadersResponse }
        });
    }
    const DB = env.DB; // 使用绑定的D1实例

    // --- API 路由 ---
    try {
        if (url.pathname === "/api/hello") {
            const data = { message: "你好，来自斗地主后端 Worker！(已连接D1)" };
            return new Response(JSON.stringify(data), {
                headers: { 'Content-Type': 'application/json', ...corsHeadersResponse },
            });
        }

        // 用户注册 API
        if (url.pathname === "/api/auth/register" && request.method === "POST") {
            const { username, password, email } = await request.json();

            if (!username || !password) {
                return new Response(JSON.stringify({ error: "用户名和密码不能为空" }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeadersResponse }});
            }
            if (username.length < 3 || password.length < 6) {
                return new Response(JSON.stringify({ error: "用户名至少3位，密码至少6位" }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeadersResponse }});
            }

            const existingUserStmt = DB.prepare("SELECT id FROM Users WHERE username = ?1");
            const existingUser = await existingUserStmt.bind(username).first();
            if (existingUser) {
                return new Response(JSON.stringify({ error: "用户名已存在" }), { status: 409, headers: { 'Content-Type': 'application/json', ...corsHeadersResponse }});
            }

            if (email) { // 可选的邮箱唯一性检查
                const existingEmailStmt = DB.prepare("SELECT id FROM Users WHERE email = ?1");
                const existingEmail = await existingEmailStmt.bind(email).first();
                if (existingEmail) {
                    return new Response(JSON.stringify({ error: "邮箱已被注册" }), { status: 409, headers: { 'Content-Type': 'application/json', ...corsHeadersResponse }});
                }
            }

            const hashedPassword = await hashPassword(password);
            const userId = generateUUID();

            const stmt = DB.prepare("INSERT INTO Users (id, username, hashedPassword, email, createdAt) VALUES (?1, ?2, ?3, ?4, datetime('now'))");
            await stmt.bind(userId, username, hashedPassword, email || null).run();

            return new Response(JSON.stringify({ message: "注册成功", userId: userId }), {
                status: 201, headers: { 'Content-Type': 'application/json', ...corsHeadersResponse }
            });
        }

        // 用户登录 API
        if (url.pathname === "/api/auth/login" && request.method === "POST") {
            const { username, password } = await request.json();
            if (!username || !password) {
                return new Response(JSON.stringify({ error: "用户名和密码不能为空" }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeadersResponse }});
            }

            const stmt = DB.prepare("SELECT id, username, hashedPassword FROM Users WHERE username = ?1");
            const user = await stmt.bind(username).first();

            if (!user) {
                return new Response(JSON.stringify({ error: "用户不存在或密码错误" }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeadersResponse }});
            }

            const hashedPasswordAttempt = await hashPassword(password);
            if (hashedPasswordAttempt !== user.hashedPassword) {
                return new Response(JSON.stringify({ error: "用户不存在或密码错误" }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeadersResponse }});
            }
            
            // 登录成功
            // 真实应用会在这里生成并返回JWT或session token
            return new Response(JSON.stringify({
                message: "登录成功",
                userId: user.id,
                username: user.username,
                // token: "your-generated-session-token-or-jwt" // 示例
            }), {
                headers: { 'Content-Type': 'application/json', ...corsHeadersResponse }
            });
        }

        // 更多API路由 (房间功能等未来添加)
        // if (url.pathname.startsWith("/api/room/")) { ... }

        return new Response("API路径未找到或方法不支持。", { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeadersResponse }});

    } catch (e) {
        console.error("API请求处理错误:", e);
        // 更详细的错误日志
        if (e.cause) console.error("Cause:", e.cause);

        let errorMessage = "服务器内部错误";
        let statusCode = 500;

        if (e.message && e.message.includes("UNIQUE constraint failed")) {
             errorMessage = "用户名或邮箱已存在 (数据库约束)";
             statusCode = 409; // Conflict
        } else if (e instanceof SyntaxError && e.message.includes("JSON")) {
            errorMessage = "请求体不是有效的JSON";
            statusCode = 400; // Bad Request
        }
        // 也可以根据 e.name 判断，例如 D1Error

        return new Response(JSON.stringify({ error: errorMessage, details: e.message }), {
            status: statusCode,
            headers: { 'Content-Type': 'application/json', ...corsHeadersResponse }
        });
    }
}

export default {
    fetch: handleFetch
};

// 如果在addEventListener模式下，并且env不是自动注入到handleFetch的第一个参数（旧版或特定配置）
// addEventListener('fetch', event => {
//   event.respondWith(handleFetch(event.request, self.env || {}, event.ctx || event));
// });
