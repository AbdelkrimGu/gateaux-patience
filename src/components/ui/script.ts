// Script detection for typed names (the page locale doesn't tell us which
// script a visitor types in). Arabic, Arabic Supplement/Extended-A and the
// presentation forms.
export const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

export const hasArabic = (s: string) => ARABIC.test(s);
