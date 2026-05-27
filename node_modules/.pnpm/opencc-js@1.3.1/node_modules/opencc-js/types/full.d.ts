export {
  Trie,
  ConverterFactory,
  ConverterBuilder,
  CustomConverter,
  HTMLConverter
} from './core';

export type {
  ConverterFunction,
  ConverterOptions,
  DictGroup,
  DictLike,
  HTMLConvertHandler,
  LocalePreset
} from './core';

import type { ConverterFunction, ConverterOptions } from './core';
import * as Locale from './preset';
import {
  Trie,
  ConverterFactory,
  ConverterBuilder,
  CustomConverter,
  HTMLConverter
} from './core';

export function Converter(options: ConverterOptions): ConverterFunction;
export { Locale };

declare const OpenCC: {
  Trie: typeof Trie;
  ConverterFactory: typeof ConverterFactory;
  ConverterBuilder: typeof ConverterBuilder;
  Converter: typeof Converter;
  CustomConverter: typeof CustomConverter;
  HTMLConverter: typeof HTMLConverter;
  Locale: typeof Locale;
};

export default OpenCC;
