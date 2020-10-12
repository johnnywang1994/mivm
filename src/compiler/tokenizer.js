const _nbsp_ = ' ';
const _empty_ = '';
const _space_ = '|||';

function createTokenizer(list) {
  return function tokenize(raw, matched) {
    const [tagName] = matched.split(_nbsp_);
    list.push(tagName.replace('/', _empty_));
    return `${_space_}<${matched}>${_space_}`;
  };
}

function createAttrParser(token) {
  token.attrs = Object.create(null);
  return function attrParser(raw, attrName, binding) {
    // console.log(attrName, '|', binding);
    token.attrs[attrName] = binding;
    return raw;
  };
}

function createToken(value, tagNameList) {
  const startTagReg = /^\<\w+/;
  const endTagReg = /^\<\/\w+\>$/;
  const attrReg = /\s+['"]?([^=]+)['"]?=['"]+([^'"]+)['"]+/gi;
  const token = {
    type: 'Value',
    tagName: undefined,
    nodeType: undefined,
    attrs: undefined,
    value,
  };

  if (value.includes('<')) {
    token.nodeType = 1;
    token.tagName = tagNameList.shift();
    if (startTagReg.test(value)) {
      token.type = 'TagOpen';
      const tokenAttrParser = createAttrParser(token);
      token.value.replace(attrReg, tokenAttrParser);
    }
    else if (endTagReg.test(value)) token.type = 'TagClose';
  } else {
    token.nodeType = 3;
  }

  return token;
}

export function htmlTokenize(string) {
  const tagRex = /\<([^>]*)\>/gi;
  const tagNextLine = /\n\s*([<>]?)/gi;
  const tagNameList = [];
  const tokenizer = createTokenizer(tagNameList);
  return string.replace(
      tagNextLine,
      (s0, s1) => (s1 === '<' || s1 === '>') ? s1 : _nbsp_
    )
    .replace(tagRex, tokenizer)
    .split(_space_)
    .filter((str) => (str !== _empty_ && str !== _nbsp_))
    .map((str) => createToken(str, tagNameList));
}