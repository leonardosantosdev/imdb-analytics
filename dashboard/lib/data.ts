import { readFile } from "fs/promises";
import path from "path";

export type Dataset<T> = {
  generatedAt: string;
  snapshotDate: string;
  rows: number;
  data: T[];
  note?: string;
};

const emptyDataset = <T,>(note: string): Dataset<T> => ({
  generatedAt: "",
  snapshotDate: "",
  rows: 0,
  data: [],
  note
});

export async function readDataset<T>(fileName: string): Promise<Dataset<T>> {
  const filePath = path.join(process.cwd(), "public", "data", fileName);
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as Dataset<T>;
  } catch (error) {
    return emptyDataset("Dataset not found yet. Run the pipeline to generate it.");
  }
}