import type { DictGroup, DictLike } from './core';

export const from: Record<string, readonly DictGroup[]>;
export const to: Record<string, readonly DictGroup[]>;
export const configs: Record<string, {
  segmentation: DictLike;
  conversionChain: readonly DictGroup[];
}>;
