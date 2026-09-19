import base from '@epooja/config/eslint/base';
import epoojaRules from '@epooja/config/eslint/react-native';

/**
 * This package holds components, so unlike panchangam/sankalpam/content it may
 * import React Native. The §15 content rules still apply: no colour literals
 * outside tokens, no ritual text in code.
 */
export default [...base, ...epoojaRules];
