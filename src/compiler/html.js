export function html(strings, ...deps) {
  const template = strings.reduce((result, str, i) => {
    return result + str + (deps[i] !== void 0 ? `$dep${i}` : '');
  }, '');
  return {
    template,
    strings,
    deps,
  };
}
