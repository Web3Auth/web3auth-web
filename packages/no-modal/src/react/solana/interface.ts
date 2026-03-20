import { SolanaProvider } from "@solana/react-hooks";
import type { ComponentProps } from "react";

export type SolanaProviderProps = Omit<ComponentProps<typeof SolanaProvider>, "client" | "config">;
