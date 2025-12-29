import { Card } from "../components/Card";
import { ChartCard } from "../components/ChartCard";
import { SectionHeader } from "../components/SectionHeader";
import { GenrePopularityLine } from "../components/charts/GenrePopularityLine";
import { GenreWeightedBar } from "../components/charts/GenreWeightedBar";
import { RuntimeRatingScatter } from "../components/charts/RuntimeRatingScatter";
import { readDataset } from "@/lib/data";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { formatDate, formatNumber, formatRating } from "@/lib/format";

interface GenreWeighted {
  genre: string;
  titleCount: number;
  totalVotes: number;
  weightedRating: number;
}

interface GenrePopularity {
  decade: number;
  genre: string;
  titleCount: number;
  totalVotes: number;
}

interface RuntimeRating {
  genre: string;
  titleCount: number;
  avgRuntimeMinutes: number;
  medianRuntimeMinutes: number;
  avgRating: number;
  medianRating: number;
}

export default async function Page() {
  const locale = getLocale();
  const t = createTranslator(locale);

  const [genreWeighted, genrePopularity, runtimeRating] = await Promise.all([
    readDataset<GenreWeighted>("genre_weighted_ratings.json"),
    readDataset<GenrePopularity>("genre_popularity_by_decade.json"),
    readDataset<RuntimeRating>("runtime_vs_rating_by_genre.json")
  ]);

  const weightedSorted = [...genreWeighted.data].sort(
    (a, b) => b.weightedRating - a.weightedRating
  );

  const highlight = weightedSorted[0];
  const snapshotLabel = genreWeighted.snapshotDate
    ? formatDate(genreWeighted.snapshotDate, locale)
    : "-";
  const weightedTop = weightedSorted.slice(0, 12).map(item => ({
    genre: item.genre,
    weightedRating: item.weightedRating
  }));

  const totalVotesByGenre = genrePopularity.data.reduce<Record<string, number>>((acc, row) => {
    acc[row.genre] = (acc[row.genre] || 0) + row.totalVotes;
    return acc;
  }, {});

  const topGenres = Object.entries(totalVotesByGenre)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
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

  const scatterData = runtimeRating.data.slice(0, 12).map(item => ({
    genre: item.genre,
    avgRuntimeMinutes: item.avgRuntimeMinutes,
    avgRating: item.avgRating,
    titleCount: item.titleCount
  }));

  return (
    <div className="page">
      <section className="hero">
        {genreWeighted.snapshotDate && (
          <p className="hero__meta">{t("common.snapshot", { value: snapshotLabel })}</p>
        )}
        <div>
          <p className="hero__eyebrow">{t("genres.hero.eyebrow")}</p>
          <h1 className="hero__title">{t("genres.hero.title")}</h1>
          <p className="hero__subtitle">{t("genres.hero.subtitle")}</p>
        </div>
        <div className="hero__stat">
          <p className="hero__stat-label">{t("genres.hero.statLabel")}</p>
          <p className="hero__stat-value">
            {highlight ? formatRating(highlight.weightedRating, locale) : "-"}
          </p>
          <p className="hero__stat-title">
            {highlight?.genre || t("genres.hero.statFallbackTitle")}
          </p>
          <p className="hero__stat-meta">
            {t("genres.hero.statMeta", {
              votes: highlight ? formatNumber(highlight.totalVotes, locale) : "-"
            })}
          </p>
        </div>
      </section>

      <section className="section grid grid--2">
        <ChartCard
          title={t("genres.section.weighted.title")}
          eyebrow={t("genres.section.weighted.eyebrow")}
          caption={t("genres.section.weighted.caption")}
        >
          <GenreWeightedBar
            data={weightedTop}
            emptyLabel={t("table.empty")}
            tooltipLabel={t("chart.weightedRating")}
          />
        </ChartCard>

        <ChartCard
          title={t("genres.section.popularity.title")}
          eyebrow={t("genres.section.popularity.eyebrow")}
          caption={t("genres.section.popularity.caption")}
        >
          <GenrePopularityLine
            data={popularityLine}
            genres={topGenres}
            emptyLabel={t("table.empty")}
          />
        </ChartCard>
      </section>

      <section className="section">
        <ChartCard
          title={t("genres.section.runtime.title")}
          eyebrow={t("genres.section.runtime.eyebrow")}
          description={t("genres.section.runtime.description")}
          caption={t("genres.section.runtime.caption")}
        >
          <RuntimeRatingScatter
            data={scatterData}
            emptyLabel={t("table.empty")}
            avgRuntimeLabel={t("chart.avgRuntime")}
            avgRatingLabel={t("chart.avgRating")}
          />
        </ChartCard>
      </section>

      <section className="section">
        <SectionHeader
          title={t("genres.section.highlights.title")}
          description={t("genres.section.highlights.description")}
        />
        <div className="grid grid--3">
          {weightedSorted.slice(0, 6).map(item => (
            <Card key={item.genre} title={item.genre} eyebrow={t("genres.section.highlights.eyebrow")}>
              <p>
                {t("genres.highlights.weighted")}: {formatRating(item.weightedRating, locale)}
              </p>
              <p>
                {t("genres.highlights.votes")}: {formatNumber(item.totalVotes, locale)}
              </p>
              <p>
                {t("genres.highlights.titles")}: {formatNumber(item.titleCount, locale)}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
