import type { Database } from "./database.types";

type Functions = Database["public"]["Functions"];
type RecordEntry = Functions["record_financial_entry"];

// PostgreSQL accepts NULL for the external side of income/expense entries.
// The generator cannot infer argument nullability from function bodies.
export type AppDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Functions"> & {
    Functions: Omit<Functions, "record_financial_entry"> & {
      record_financial_entry: Omit<RecordEntry, "Args"> & {
        Args: Omit<RecordEntry["Args"], "source_id" | "destination_id"> & {
          source_id: string | null;
          destination_id: string | null;
        };
      };
    };
  };
};
