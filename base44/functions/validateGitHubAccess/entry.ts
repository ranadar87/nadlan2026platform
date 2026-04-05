import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = Deno.env.get("GITHUB_TOKEN");
    if (!token) return Response.json({ error: 'GitHub token not found' }, { status: 500 });

    // בדוק גישה ל-user
    const userRes = await fetch("https://api.github.com/user", {
      headers: { "Authorization": `Bearer ${token}`, "User-Agent": "Base44" },
    });
    
    if (!userRes.ok) {
      return Response.json({ error: 'Token invalid or expired', status: userRes.status }, { status: 401 });
    }

    const ghUser = await userRes.json();

    // בדוק גישה ל-repo
    const repoRes = await fetch("https://api.github.com/repos/ranadar87/botnadwa", {
      headers: { "Authorization": `Bearer ${token}`, "User-Agent": "Base44" },
    });

    if (!repoRes.ok) {
      return Response.json({ error: 'No access to repository' }, { status: 403 });
    }

    const repo = await repoRes.json();

    return Response.json({
      success: true,
      github_user: ghUser.login,
      repository: repo.full_name,
      access: "✅ מלא",
      can_push: repo.permissions.push,
      can_admin: repo.permissions.admin,
      message: "🔗 חיבור מוצלח! יש גישה מלאה ל-repository"
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});