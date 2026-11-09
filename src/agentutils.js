// AgenticAlert - a notifier for slop/vibe/gpt repositories
// Copyright (C) 2026-present SocksTheWolf
//
// Licensed under GPL: https://agenticalert.download/LICENSE.txt

const aiRegexSafeArray = (arr) => {
  return arr.map((itm) => itm.replace(/(\*|\.|\-)/g, "\\$1"));
}
const aiRegexReplaceSpace = (arr) => {
  return arr.map((itm) => itm.replace(/\s/g, "[\\s|\\W]"));
}

const compactRegexResult = (content, regex) => {
  return [...content.matchAll(regex)].map((itm) => itm[1]);
}

// pluralizes words
const pluralize = (items, word, multiple="s", noNumber=false) => {
  const number = items.length ?? items;
  return `${!noNumber ? number: ""} ${word}${number>1?multiple:""}`;
}

const optSpace = "[\\s|\\W]?";