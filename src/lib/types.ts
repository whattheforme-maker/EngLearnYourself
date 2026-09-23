import type { WordRow } from "@/db/schema";

export type WordDTO = Omit<WordRow, "createdAt" | "updatedAt"> & {
  createdAt: string;
};

export function toDTO(row: WordRow): WordDTO {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
  };
}
