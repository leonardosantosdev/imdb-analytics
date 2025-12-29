import { Card } from "../components/Card";
import { ChartCard } from "../components/ChartCard";
import { DataTable } from "../components/DataTable";
import { SectionHeader } from "../components/SectionHeader";
import { SeasonRatingsChart } from "../components/charts/SeasonRatingsChart";
import { TopEpisodesBar } from "../components/charts/TopEpisodesBar";
import { readDataset } from "@/lib/data";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { formatDate, formatNumber, formatRating } from "@/lib/format";

interface TopEpisode {
  tconst: string;
  seriesTitle: string;
  episodeTitle: string;
  seasonNumber: number | null;
  episodeNumber: number | null;
  averageRating: number;
  numVotes: number;
}

interface SeasonRating {
  seriesTconst: string;
  seriesTitle: string;
  seasonNumber: number;
  avgRating: number;
  totalVotes: number;
  episodeCount: number;
}

interface QualityDrop {
  seriesTconst: string;
  seriesTitle: string;
  season1Rating: number;
  lastSeasonRating: number;
  lastSeason: number;
  qualityDrop: number;
}

export default async function Page() {
  const locale = getLocale();
  const t = createTranslator(locale);

  const [topEpisodes, seasonRatings, qualityDrop] = await Promise.all([
    readDataset<TopEpisode>("top_episodes.json"),
    readDataset<SeasonRating>("series_season_ratings.json"),
    readDataset<QualityDrop>("series_quality_drop.json")
  ]);

  const topEpisode = topEpisodes.data[0];
  const snapshotLabel = topEpisodes.snapshotDate
    ? formatDate(topEpisodes.snapshotDate, locale)
    : "-";
  const topEpisodeChart = topEpisodes.data.slice(0, 10).map(item => ({
    episodeLabel: `${item.seriesTitle} S${item.seasonNumber ?? "?"}E${item.episodeNumber ?? "?"}`,
    averageRating: item.averageRating
  }));

  const seriesVotes = seasonRatings.data.reduce<Record<string, number>>((acc, row) => {
    acc[row.seriesTitle] = (acc[row.seriesTitle] || 0) + row.totalVotes;
    return acc;
  }, {});

  const topSeries = Object.entries(seriesVotes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  const seasonMap = new Map<number, Record<string, number | string>>();
  for (const row of seasonRatings.data) {
    if (!topSeries.includes(row.seriesTitle)) continue;
    const existing = seasonMap.get(row.seasonNumber) || { seasonNumber: row.seasonNumber };
    existing[row.seriesTitle] = row.avgRating;
    seasonMap.set(row.seasonNumber, existing);
  }

  const seasonLineData = Array.from(seasonMap.values()).sort(
    (a, b) => Number(a.seasonNumber) - Number(b.seasonNumber)
  );

  return (
    <div className="page">
      <section className="hero">
        {topEpisodes.snapshotDate && (
          <p className="hero__meta">{t("common.snapshot", { value: snapshotLabel })}</p>
        )}
        <div>
          <p className="hero__eyebrow">{t("series.hero.eyebrow")}</p>
          <h1 className="hero__title">{t("series.hero.title")}</h1>
          <p className="hero__subtitle">{t("series.hero.subtitle")}</p>
        </div>
        <div className="hero__stat">
          <p className="hero__stat-label">{t("series.hero.statLabel")}</p>
          <p className="hero__stat-value">
            {topEpisode ? formatRating(topEpisode.averageRating, locale) : "-"}
          </p>
          <p className="hero__stat-title">
            {topEpisode?.episodeTitle || t("series.hero.statFallbackTitle")}
          </p>
          <p className="hero__stat-meta">
            {topEpisode?.seriesTitle || t("series.hero.statFallbackSeries")}
          </p>
        </div>
      </section>

      <section className="section grid grid--2">
        <ChartCard
          title={t("series.section.topEpisodes.title")}
          eyebrow={t("series.section.topEpisodes.eyebrow")}
          caption={t("series.section.topEpisodes.caption")}
        >
          <TopEpisodesBar
            data={topEpisodeChart}
            emptyLabel={t("table.empty")}
            ratingLabel={t("chart.rating")}
          />
        </ChartCard>

        <ChartCard
          title={t("series.section.seasonRatings.title")}
          eyebrow={t("series.section.seasonRatings.eyebrow")}
          caption={t("series.section.seasonRatings.caption")}
        >
          <SeasonRatingsChart
            data={seasonLineData}
            series={topSeries}
            emptyLabel={t("table.empty")}
          />
        </ChartCard>
      </section>

      <section className="section">
        <SectionHeader
          title={t("series.section.qualityDrop.title")}
          description={t("series.section.qualityDrop.description")}
        />
        <Card
          title={t("series.section.qualityDrop.cardTitle")}
          eyebrow={t("series.section.qualityDrop.cardEyebrow")}
        >
          <DataTable
            rows={qualityDrop.data}
            limit={12}
            showRank
            emptyLabel={t("table.empty")}
            columns={[
              { key: "seriesTitle", label: t("common.series") },
              {
                key: "season1Rating",
                label: "S1",
                align: "right",
                render: value => formatRating(value as number, locale)
              },
              {
                key: "lastSeasonRating",
                label: t("common.latest"),
                align: "right",
                render: value => formatRating(value as number, locale)
              },
              {
                key: "qualityDrop",
                label: t("common.drop"),
                align: "right",
                render: value => formatRating(value as number, locale)
              }
            ]}
          />
        </Card>
      </section>

      <section className="section">
        <SectionHeader
          title={t("series.section.topRated.title")}
          description={t("series.section.topRated.description")}
        />
        <Card
          title={t("series.section.topRated.cardTitle")}
          eyebrow={t("series.section.topRated.cardEyebrow")}
        >
          <DataTable
            rows={topEpisodes.data}
            limit={10}
            showRank
            emptyLabel={t("table.empty")}
            columns={[
              { key: "seriesTitle", label: t("common.series") },
              { key: "episodeTitle", label: t("common.episode") },
              {
                key: "seasonNumber",
                label: t("common.season"),
                align: "right"
              },
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
        </Card>
      </section>
    </div>
  );
}
