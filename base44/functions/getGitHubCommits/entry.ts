import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = Deno.env.get("GITHUB_TOKEN");
    if (!token) return Response.json({ error: 'GitHub token not configured' }, { status: 500 });

    const owner = "ranadar87";
    const repo = "botnadwa";

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Base44",
      },
    });

    if (!res.ok) {
      const error = await res.text();
      return Response.json({ error: `GitHub API error: ${res.status}`, details: error }, { status: res.status });
    }

    const commits = await res.json();
    const formatted = commits.map(c => ({
      sha: c.sha.substring(0, 7),
      message: c.commit.message.split('\n')[0],
      author: c.commit.author.name,
      date: new Date(c.commit.author.date).toLocaleDateString('he-IL'),
      time: new Date(c.commit.author.date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      url: c.html_url,
    }));

    return Response.json({ commits: formatted, total: commits.length, repository: `${owner}/${repo}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});