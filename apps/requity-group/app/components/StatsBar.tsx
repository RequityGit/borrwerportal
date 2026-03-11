import type { SiteStat } from "../../lib/types";

export default function StatsBar({ stats }: { stats: SiteStat[] }) {
  if (!stats.length) return null;

  return (
    <div className="stats-bar">
      {stats.map((stat, i) => (
        <div key={stat.id} className="stat-cell">
          <div className={`stat-num${i === 0 ? " champagne" : ""}`}>
            {stat.display_value}
          </div>
          <div className="stat-lbl">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
