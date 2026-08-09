/**
 * 【処理概要】
 *   TeaBlend が必要とする限定的な YAML のパーサ（ネストしたオブジェクト／配列の最小実装）。
 *
 * 【パラメータ仕様】
 *   - `parseSimpleYaml(input: string): YamlValue` … ルートは object か array。コメント行（先頭 `#`）をスキップ
 *
 * 【メンテナンス】
 *   完全な YAML 1.2 非互換。アンカー・複雑なリテラルは未対応。メニュー／レポート定義はこのサブセットに収める。
 */
type YamlScalar = string | number | boolean | null;
type YamlValue = YamlScalar | YamlValue[] | { [k: string]: YamlValue };

type Line = {
  indent: number;
  text: string;
  raw: string;
};

const countIndent = (s: string): number => {
  let n = 0;
  for (const ch of s) {
    if (ch === " ") n += 1;
    else break;
  }
  return n;
};

const stripComment = (s: string): string => {
  // extremely small: treat leading # as comment, otherwise keep '#'
  const trimmed = s.trimStart();
  if (trimmed.startsWith("#")) return "";
  return s;
};

const parseScalar = (raw: string): YamlScalar => {
  const s = raw.trim();
  if (s.length === 0) return "";
  if (s === "null" || s === "NULL" || s === "~") return null;
  if (s === "true" || s === "TRUE") return true;
  if (s === "false" || s === "FALSE") return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  // remove surrounding quotes if any
  const m = s.match(/^"(.*)"$/) || s.match(/^'(.*)'$/);
  return m ? m[1] : s;
};

const toLines = (input: string): Line[] => {
  const rawLines = input.replace(/\r\n/g, "\n").split("\n");
  const lines: Line[] = [];
  for (const raw of rawLines) {
    const noComment = stripComment(raw);
    if (noComment.trim().length === 0) continue;
    const indent = countIndent(noComment);
    const text = noComment.trim();
    lines.push({ indent, text, raw: raw });
  }
  return lines;
};

class Cursor {
  constructor(public lines: Line[], public i: number = 0) {}
  peek(): Line | null {
    return this.i < this.lines.length ? this.lines[this.i] : null;
  }
  next(): Line | null {
    const v = this.peek();
    if (v) this.i += 1;
    return v;
  }
}

const parseBlock = (cur: Cursor, baseIndent: number): YamlValue => {
  const first = cur.peek();
  if (!first) return {};
  if (first.indent < baseIndent) return {};
  if (first.text.startsWith("-")) {
    return parseArray(cur, baseIndent);
  }
  return parseObject(cur, baseIndent);
};

const parseArray = (cur: Cursor, baseIndent: number): YamlValue[] => {
  const out: YamlValue[] = [];
  while (true) {
    const line = cur.peek();
    if (!line) break;
    if (line.indent < baseIndent) break;
    if (!line.text.startsWith("-")) break;
    if (line.indent !== baseIndent) break;

    const itemLine = cur.next()!;
    const rest = itemLine.text.replace(/^-/, "").trim();
    if (rest.length === 0) {
      const next = cur.peek();
      if (!next) {
        out.push(null);
        continue;
      }
      out.push(parseBlock(cur, baseIndent + 2));
      continue;
    }

    // "- key: value" or "- scalar"
    const kv = rest.match(/^([^:]+):(.*)$/);
    if (kv) {
      const key = kv[1].trim();
      const valueRaw = kv[2].trim();
      const obj: { [k: string]: YamlValue } = {};
      if (valueRaw.length > 0) {
        obj[key] = parseScalar(valueRaw);
      } else {
        obj[key] = parseBlock(cur, baseIndent + 2);
      }

      // consume additional object lines indented under this dash
      const next = cur.peek();
      if (next && next.indent >= baseIndent + 2 && !next.text.startsWith("-")) {
        const restObj = parseObject(cur, baseIndent + 2);
        if (typeof restObj === "object" && !Array.isArray(restObj) && restObj) {
          Object.assign(obj, restObj);
        }
      }
      out.push(obj);
    } else {
      out.push(parseScalar(rest));
    }
  }
  return out;
};

const parseObject = (cur: Cursor, baseIndent: number): { [k: string]: YamlValue } => {
  const out: { [k: string]: YamlValue } = {};
  while (true) {
    const line = cur.peek();
    if (!line) break;
    if (line.indent < baseIndent) break;
    if (line.text.startsWith("-") && line.indent === baseIndent) break;
    if (line.indent !== baseIndent) break;

    const objLine = cur.next()!;
    const m = objLine.text.match(/^([^:]+):(.*)$/);
    if (!m) {
      throw new Error(`YAML形式エラー: "${objLine.raw}"`);
    }
    const key = m[1].trim();
    const valueRaw = m[2].trim();
    if (valueRaw.length > 0) {
      out[key] = parseScalar(valueRaw);
      continue;
    }
    out[key] = parseBlock(cur, baseIndent + 2);
  }
  return out;
};

export const parseSimpleYaml = (input: string): YamlValue => {
  const cur = new Cursor(toLines(input), 0);
  const value = parseBlock(cur, 0);
  return value;
};

