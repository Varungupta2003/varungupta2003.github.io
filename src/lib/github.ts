export interface RepoMeta {
  stars: number;
  updatedAt: string;
  language: string | null;
}

// Build-time fetch — baked into the static HTML at deploy, not per-visitor.
export async function getRepoMeta(repoPath: string): Promise<RepoMeta | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repoPath}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      stars: data.stargazers_count ?? 0,
      updatedAt: data.pushed_at ?? data.updated_at,
      language: data.language ?? null,
    };
  } catch {
    return null;
  }
}

export function relativeTime(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function repoPathFromUrl(url: string): string {
  return url.replace("https://github.com/", "").replace(/\/$/, "");
}
