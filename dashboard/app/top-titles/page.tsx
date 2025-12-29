import { Card } from "../components/Card";
import { ChartCard } from "../components/ChartCard";
import { DataTable } from "../components/DataTable";
import { SectionHeader } from "../components/SectionHeader";
import { TopTitlesBar } from "../components/charts/TopTitlesBar";
import { readDataset } from "@/lib/data";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { formatDate, formatNumber, formatRating, formatYear } from "@/lib/format";

interface TopTitle {
  tconst: string;
  primaryTitle: string;
  titleType: string;
  startYear: number | null;
  genres: string | null;
  averageRating: number;
  numVotes: number;
}

interface TopByDecade extends TopTitle {
  decade: number;
  rank: number;
}

interface MainstreamCult extends TopTitle {
  category: "mainstream" | "cult";
}

export default async function Page() {
  const locale = getLocale();
  const t = createTranslator(locale);

  const [topTitles, topByDecade, mainstreamCult] = await Promise.all([
    readDataset<TopTitle>("top_titles_all_time.json"),
    readDataset<TopByDecade>("top_titles_by_decade.json"),
    readDataset<MainstreamCult>("mainstream_vs_cult.json")
  ]);

  const headline = topTitles.data[0];
  const snapshotLabel = topTitles.snapshotDate
    ? formatDate(topTitles.snapshotDate, locale)
    : "-";
  const top10 = topTitles.data.slice(0, 10).map(item => ({
    primaryTitle: item.primaryTitle,
    averageRating: item.averageRating
  }));

  const decadeMap = topByDecade.data.reduce<Record<string, TopByDecade[]>>((acc, row) => {
    const key = String(row.decade);
    acc[key] = acc[key] || [];
    acc[key].push(row);
    return acc;
  }, {});

  const decades = Object.keys(decadeMap).sort();

  const mainstream = mainstreamCult.data.filter(item => item.category === "mainstream");
  const cult = mainstreamCult.data.filter(item => item.category === "cult");

  return (
    <div className="page">
      <section className="hero">
        {topTitles.snapshotDate && (
          <p className="hero__meta">{t("common.snapshot", { value: snapshotLabel })}</p>
        )}
        <div>
          <p className="hero__eyebrow">{t("topTitles.hero.eyebrow")}</p>
          <h1 className="hero__title">{t("topTitles.hero.title")}</h1>
          <p className="hero__subtitle">{t("topTitles.hero.subtitle")}</p>
        </div>
        <div className="hero__stat">
          <p className="hero__stat-label">{t("topTitles.hero.statLabel")}</p>
          <p className="hero__stat-value">
            {headline ? formatRating(headline.averageRating, locale) : "-"}
          </p>
          <p className="hero__stat-title">
            {headline?.primaryTitle || t("topTitles.hero.statFallbackTitle")}
          </p>
          <p className="hero__stat-meta">
            {t("topTitles.hero.statMeta", {
              votes: headline ? formatNumber(headline.numVotes, locale) : "-"
            })}
          </p>
        </div>
      </section>

      <section className="section">
        <SectionHeader
          title={t("topTitles.section.top10.title")}
          description={t("topTitles.section.top10.description")}
        />
        <ChartCard
          title={t("topTitles.section.top10.cardTitle")}
          eyebrow={t("topTitles.section.top10.cardEyebrow")}
        >
          <TopTitlesBar
            data={top10}
            emptyLabel={t("table.empty")}
            ratingLabel={t("chart.rating")}
          />
        </ChartCard>
      </section>

      <section className="section">
        <SectionHeader
          title={t("topTitles.section.allTime.title")}
          description={t("topTitles.section.allTime.description")}
        />
        <Card
          title={t("topTitles.section.allTime.cardTitle")}
          eyebrow={t("topTitles.section.allTime.cardEyebrow")}
        >
          <DataTable
            rows={topTitles.data}
            limit={20}
            showRank
            emptyLabel={t("table.empty")}
            columns={[
              { key: "primaryTitle", label: t("common.title") },
              {
                key: "startYear",
                label: t("common.year"),
                align: "right",
                render: value => formatYear(value as number)
              },
              { key: "titleType", label: t("common.type") },
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

      <section className="section">
        <SectionHeader
          title={t("topTitles.section.byDecade.title")}
          description={t("topTitles.section.byDecade.description")}
        />
        <div className="grid grid--2">
          {decades.map(decade => (
            <Card key={decade} title={`${decade}s`} eyebrow={t("topTitles.section.byDecade.cardEyebrow")}>
              <DataTable
                rows={decadeMap[decade]}
                showRank
                rankLabel="#"
                emptyLabel={t("table.empty")}
                columns={[
                  { key: "primaryTitle", label: t("common.title") },
                  {
                    key: "averageRating",
                    label: t("common.rating"),
                    align: "right",
                    render: value => formatRating(value as number, locale)
                  }
                ]}
              />
            </Card>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeader
          title={t("topTitles.section.mainstream.title")}
          description={t("topTitles.section.mainstream.description")}
        />
        <div className="grid grid--2">
          <Card
            title={t("topTitles.section.mainstream.mainTitle")}
            eyebrow={t("topTitles.section.mainstream.mainEyebrow")}
          >
            <DataTable
              rows={mainstream}
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
          </Card>

          <Card
            title={t("topTitles.section.mainstream.cultTitle")}
            eyebrow={t("topTitles.section.mainstream.cultEyebrow")}
          >
            <DataTable
              rows={cult}
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
          </Card>
        </div>
      </section>
    </div>
  );
}
