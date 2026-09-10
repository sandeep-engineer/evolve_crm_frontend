import { Chip } from "@mui/material";
import { formatEnum } from "../utils";

export function StatusChip({ value }: { value: string }) {
  const color = value === "LOST" || value === "ARCHIVED" ? "error" : value === "FOLLOW_UP" || value.includes("TRIAL") ? "warning" : value === "CONVERTED" || value === "READY_TO_JOIN" ? "success" : "primary";
  return <Chip size="small" label={formatEnum(value)} color={color} variant="outlined" sx={{ bgcolor: `${color}.50`, borderColor: "transparent" }} />;
}
