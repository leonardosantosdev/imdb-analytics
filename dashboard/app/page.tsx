import { Card } from "./components/Card";
import { ChartCard } from "./components/ChartCard";
import { DataTable } from "./components/DataTable";
import { KpiCard } from "./components/KpiCard";
import { SectionHeader } from "./components/SectionHeader";
import { GenrePopularityLine } from "./components/charts/GenrePopularityLine";
import { GenreWeightedBar } from "./components/charts/GenreWeightedBar";
import { readDataset } from "@/lib/data";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { formatDate, formatDateTime, formatNumber, formatRating } from "@/lib/format";

interface TopTitle {
  tconst: string;
  primaryTitle: string;
  titleType: string;
  startYear: number | null;
  genres: string | null;
  averageRating: number;
  numVotes: number;
}

interface GenreWeighted {
  genre: string;
  titleCount: number;
  totalVotes: number;
  weightedRating: number;
}

interface RisingTitle {
  primaryTitle: string;
  titleType: string;
  startYear: number | null;
  genres: string | null;
  numVotesCurrent: number;
  numVotesPrevious: number;
  deltaVotes: number;
  pctChange: number | null;
}

interface GenrePopularity {
  decade: number;
  genre: string;
  titleCount: number;
  totalVotes: number;
}

export default async function Page() {
  const locale = getLocale();
  const t = createTranslator(locale);

  const [topTitles, genreWeighted, rising, genrePopularity] = await Promise.all([
    readDataset<TopTitle>("top_titles_all_time.json"),
    readDataset<GenreWeighted>("genre_weighted_ratings.json"),
    readDataset<RisingTitle>("rising_titles_votes_week_over_week.json"),
    readDataset<GenrePopularity>("genre_popularity_by_decade.json")
  ]);

  const snapshot = topTitles.snapshotDate || genreWeighted.snapshotDate;
  const updatedAt = topTitles.generatedAt || genreWeighted.generatedAt;
  const snapshotLabel = snapshot ? formatDate(snapshot, locale) : "-";
  const updatedLabel = updatedAt ? formatDateTime(updatedAt, locale) : "-";
  const headline = topTitles.data[0];
  const heroRating = headline ? formatRating(headline.averageRating, locale) : "-";
  const heroVotes = headline ? formatNumber(headline.numVotes, locale) : "-";

  const stats = [
    {
      label: t("overview.kpi.snapshot"),
      value: snapshotLabel,
      hint: updatedAt ? t("common.updatedAt", { value: updatedLabel }) : t("common.refreshPending")
    },
    {
      label: t("overview.kpi.topTitles"),
      value: String(topTitles.rows || topTitles.data.length)
    },
    {
      label: t("overview.kpi.genres"),
      value: String(genreWeighted.data.length)
    },
    {
      label: t("overview.kpi.rising"),
      value: String(rising.data.length)
    }
  ];

  const topGenreBar = [...genreWeighted.data]
    .sort((a, b) => b.weightedRating - a.weightedRating)
    .slice(0, 8)
    .map(item => ({ genre: item.genre, weightedRating: item.weightedRating }));

  const totalVotesByGenre = genrePopularity.data.reduce<Record<string, number>>((acc, row) => {
    acc[row.genre] = (acc[row.genre] || 0) + row.totalVotes;
    return acc;
  }, {});

  const topGenres = Object.entries(totalVotesByGenre)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);

  const decadeMap = new Map<number, Record<string, number | string>>();
  for (const row of genrePopularity.data) {
    if (!topGenres.includes(row.genre)) continue;
    const existing = decadeMap.get(row.decade) || { decade: row.decade };
    existing[row.genre] = row.totalVotes;
    decadeMap.set(row.decade, existing);
  }

  const popularityLine = Array.from(decadeMap.values()).sort(
    (a, b) => Number(a.decade) - Number(b.decade)
  );

  return (
    <div className="page">
      <section className="hero">
        {updatedAt && (
          <p className="hero__meta">{t("common.updatedAt", { value: updatedLabel })}</p>
        )}
        <div>
          <p className="hero__eyebrow">{t("overview.hero.eyebrow")}</p>
          <h1 className="hero__title">{t("overview.hero.title")}</h1>
          <p className="hero__subtitle">{t("overview.hero.subtitle")}</p>
        </div>
        <div className="hero__stat">
          <p className="hero__stat-label">{t("overview.hero.statLabel")}</p>
          <p className="hero__stat-value">{heroRating}</p>
          <p className="hero__stat-title">
            {headline?.primaryTitle || t("overview.hero.statFallbackTitle")}
          </p>
          <p className="hero__stat-meta">{t("overview.hero.statMeta", { votes: heroVotes })}</p>
        </div>
      </section>

      <section className="section">
        <SectionHeader
          title={t("overview.section.snapshot.title")}
          description={t("overview.section.snapshot.description")}
        />
        <div className="kpi-grid">
          {stats.map(item => (
            <KpiCard key={item.label} label={item.label} value={item.value} hint={item.hint} />
          ))}
        </div>
      </section>

      <section className="section grid grid--2">
        <ChartCard
          title={t("overview.section.top10.title")}
          eyebrow={t("overview.section.top10.eyebrow")}
          caption={t("overview.section.top10.caption")}
        >
          <DataTable
            rows={topTitles.data}
            limit={10}
            showRank
            emptyLabel={t("table.empty")}
            columns={[
              { key: "primaryTitle", label: t("common.title") },
              {
                key: "averageRating",
                label: t("common.rating"),
                align: "right",
                render: value => formatRating(value as number, locale)
              },
              {
                key: "numVotes",
                label: t("common.votes"),
                align: "right",
                render: value => formatNumber(value as number, locale)
              }
            ]}
          />
        </ChartCard>

        <ChartCard
          title={t("overview.section.topGenres.title")}
          eyebrow={t("common.genres")}
          caption={t("overview.section.topGenres.caption")}
        >
          <GenreWeightedBar
            data={topGenreBar}
            emptyLabel={t("table.empty")}
            tooltipLabel={t("chart.weightedRating")}
          />
        </ChartCard>
      </section>

      <section className="section grid grid--2">
        <ChartCard
          title={t("overview.section.popularity.title")}
          eyebrow={t("overview.section.popularity.eyebrow")}
          caption={t("overview.section.popularity.caption")}
        >
          <GenrePopularityLine
            data={popularityLine}
            genres={topGenres}
            emptyLabel={t("table.empty")}
          />
        </ChartCard>

        <Card title={t("overview.section.rising.title")} eyebrow={t("overview.section.rising.eyebrow")}>
          <DataTable
            rows={rising.data}
            limit={8}
            showRank
            emptyLabel={t("table.empty")}
            columns={[
              { key: "primaryTitle", label: t("common.title") },
              { key: "titleType", label: t("common.type") },
              {
                key: "deltaVotes",
                label: t("overview.table.plusVotes"),
                align: "right",
                render: value => formatNumber(value as number, locale)
              },
              {
                key: "pctChange",
                label: t("overview.table.change"),
                align: "right",
                render: value =>
                  value === null || value === undefined ? "-" : `${value}%`
              }
            ]}
          />
        </Card>
      </section>
    </div>
  );
}
