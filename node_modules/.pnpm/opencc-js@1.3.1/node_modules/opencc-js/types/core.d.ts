export type DictLike = string | readonly (readonly [string, string])[];
export type DictGroup = readonly DictLike[];
export type ConverterFunction = (text: string) => string;

export interface LocalePreset {
  from: Record<string, readonly DictGroup[]>;
  to: Record<string, readonly DictGroup[]>;
  configs?: Record<string, {
    segmentation: DictLike;
    conversionChain: readonly DictGroup[];
  }>;
}

export interface ConverterOptions {
  from: string;
  to: string;
}

export class Trie {
  constructor();
  addWord(source: string, replacement: string): void;
  loadDict(dict: DictLike): void;
  loadDictGroup(dictGroup: DictGroup): void;
  matchPrefix(text: string, offset: number): { end: number; value: string } | null;
  segment(text: string): string[];
  convert(text: string): string;
}

export function ConverterFactory(...dictGroups: DictGroup[]): ConverterFunction;
export function ConverterBuilder(localePreset: LocalePreset): (options: ConverterOptions) => ConverterFunction;
export function CustomConverter(dict: DictLike): ConverterFunction;

export interface HTMLConvertHandler {
  convert(): void;
  restore(): void;
}

export function HTMLConverter(
  converter: ConverterFunction,
  rootNode: HTMLElement,
  fromLangTag: string,
  toLangTag: string
): HTMLConvertHandler;
