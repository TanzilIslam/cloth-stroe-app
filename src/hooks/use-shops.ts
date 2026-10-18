"use client"

// Both shops (id, name, type). Loaded once per page.
import { getShops } from "@/api"

import { useQuery } from "./use-query"

export function useShops() {
  return useQuery(getShops, []).data ?? []
}
