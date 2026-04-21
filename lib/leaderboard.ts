export type LeaderboardEntry = {
    id?: string;
    player_key: string;
    player_name: string;
    avg_score: number;
    total_points: number;
    rank_label: string;
    mode: string;
    locale: string;
    played_at: string;
    question_count: number;
    answered_count: number;
    timed_out_count: number;
  };
  
  const LOCAL_LEADERBOARD_KEY = "mechanic_iq_local_leaderboard_v1";
  const LOCAL_PLAYER_KEY = "mechanic_iq_player_key_v1";
  const LOCAL_PLAYER_NAME_KEY = "mechanic_iq_player_name_v1";
  
  function canUseStorage() {
    return typeof window !== "undefined";
  }
  
  export function getOrCreateLocalPlayerKey() {
    if (!canUseStorage()) return "guest-server";
  
    const existing = window.localStorage.getItem(LOCAL_PLAYER_KEY);
    if (existing) return existing;
  
    const created = `guest-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(LOCAL_PLAYER_KEY, created);
    return created;
  }
  
  export function getLocalPlayerName() {
    if (!canUseStorage()) return "You";
    return window.localStorage.getItem(LOCAL_PLAYER_NAME_KEY) || "You";
  }
  
  export function setLocalPlayerName(name: string) {
    if (!canUseStorage()) return;
    const cleaned = name.trim().slice(0, 32) || "You";
    window.localStorage.setItem(LOCAL_PLAYER_NAME_KEY, cleaned);
  }
  
  export function getLocalLeaderboard(): LeaderboardEntry[] {
    if (!canUseStorage()) return [];
  
    try {
      const raw = window.localStorage.getItem(LOCAL_LEADERBOARD_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as LeaderboardEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  
  export function saveLocalLeaderboardEntry(entry: LeaderboardEntry) {
    if (!canUseStorage()) return;
  
    const rows = getLocalLeaderboard();
    const next = [entry, ...rows]
      .sort((a, b) => {
        if (b.avg_score !== a.avg_score) return b.avg_score - a.avg_score;
        if (b.total_points !== a.total_points) return b.total_points - a.total_points;
        return new Date(b.played_at).getTime() - new Date(a.played_at).getTime();
      })
      .slice(0, 40);
  
    window.localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(next));
  }
  
  export function getTopLocalLeaderboard(limit = 8) {
    return getLocalLeaderboard().slice(0, limit);
  }