import path from "path";
import JSZip from "jszip";
import { PDFParse } from "pdf-parse";
import { config } from "../../config/env";
import { QuizSolverError } from "./quiz-solver.errors";

export type QuizFileType = "pdf" | "docx";

export interface UploadedQuizFile {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}

export interface ExtractedQuizText {
    text: string;
    pageCount?: number;
    imageCount: number;
    warnings: string[];
}

const PDF_MIME_TYPES = ["application/pdf", "application/x-pdf"];
const DOCX_MIME_TYPES = ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
// Some browsers/OSes send no MIME type (or a generic one) for .docx/.pdf when
// no Office app is registered — allowed, since the real format is checked
// from the file's bytes anyway.
const GENERIC_MIME_TYPES = ["", "application/octet-stream", "binary/octet-stream"];

// Decompressed-size guard for DOCX (a zip): protects against zip bombs.
const MAX_DOCX_XML_BYTES = 40 * 1024 * 1024;

export const maxQuizFileBytes = (): number => Math.round(config.quizSolver.maxFileMb * 1024 * 1024);

// Display-only file name: multer/busboy decodes multipart file names as
// latin1, which garbles Vietnamese names — re-decode as UTF-8 when that is
// lossless. The name is never used as a path.
export const safeDisplayName = (originalname: string): string => {
    let name = originalname || "file";
    const utf8 = Buffer.from(name, "latin1").toString("utf8");
    if (!utf8.includes("�")) name = utf8;
    name = path.basename(name.replace(/\\/g, "/")).replace(/[\u0000-\u001f\u007f]/g, "").trim();
    return (name || "file").slice(0, 120);
};

// Validates size, extension, declared MIME type and the file's actual magic
// bytes — the extension alone is never trusted.
export const detectQuizFileType = (file: UploadedQuizFile): QuizFileType => {
    if (!file || !file.buffer) {
        throw new QuizSolverError("NO_FILE", "Vui lòng chọn một file PDF hoặc DOCX.", 400);
    }
    if (file.size === 0 || file.buffer.length === 0) {
        throw new QuizSolverError("EMPTY_FILE", "File rỗng. Vui lòng chọn file đề có nội dung.", 400);
    }
    if (file.buffer.length > maxQuizFileBytes()) {
        throw new QuizSolverError(
            "FILE_TOO_LARGE",
            `File vượt quá giới hạn ${config.quizSolver.maxFileMb} MB. Vui lòng chọn file nhỏ hơn.`,
            413
        );
    }

    const ext = path.extname(file.originalname || "").toLowerCase();
    const mime = (file.mimetype || "").toLowerCase();
    const unsupported = new QuizSolverError(
        "UNSUPPORTED_FILE",
        "Chỉ hỗ trợ file PDF (.pdf) hoặc Word (.docx) hợp lệ.",
        415
    );

    if (ext === ".pdf") {
        if (!PDF_MIME_TYPES.includes(mime) && !GENERIC_MIME_TYPES.includes(mime)) throw unsupported;
        // "%PDF-" header; the spec allows leading junk within the first 1 KB.
        const head = file.buffer.subarray(0, 1024).toString("latin1");
        if (!head.includes("%PDF-")) throw unsupported;
        return "pdf";
    }
    if (ext === ".docx") {
        if (!DOCX_MIME_TYPES.includes(mime) && !GENERIC_MIME_TYPES.includes(mime)) throw unsupported;
        // ZIP local-file-header signature "PK\x03\x04"; the OOXML structure
        // itself is verified when the archive is opened.
        if (file.buffer.readUInt32LE(0) !== 0x04034b50) throw unsupported;
        return "docx";
    }
    throw unsupported;
};

export const extractQuizText = async (buffer: Buffer, type: QuizFileType): Promise<ExtractedQuizText> => {
    return type === "pdf" ? extractPdfText(buffer) : extractDocxText(buffer);
};

// ---------------------------------------------------------------- PDF ----

const extractPdfText = async (buffer: Buffer): Promise<ExtractedQuizText> => {
    const warnings: string[] = [];
    const maxPages = config.quizSolver.maxPdfPages;
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    let text = "";
    let pageCount = 0;
    try {
        const result = await parser.getText({ first: maxPages, pageJoiner: "" });
        text = result.text || "";
        pageCount = result.total;
    } catch (err: any) {
        const name = String(err?.name || "");
        if (name === "PasswordException") {
            throw new QuizSolverError("ENCRYPTED_PDF", "PDF được đặt mật khẩu. Vui lòng gỡ mật khẩu rồi tải lại.", 422);
        }
        throw new QuizSolverError("CORRUPT_FILE", "Không đọc được file PDF (file có thể bị hỏng).", 422);
    } finally {
        await parser.destroy().catch(() => undefined);
    }

    if (pageCount > maxPages) {
        warnings.push(`Đề có ${pageCount} trang; hệ thống chỉ đọc ${maxPages} trang đầu.`);
    }

    const meaningfulChars = text.replace(/\s+/g, "").length;
    if (meaningfulChars < 20) {
        throw new QuizSolverError(
            "SCANNED_PDF",
            "Không trích xuất được văn bản — PDF có thể là bản scan (ảnh chụp). Hệ thống chưa hỗ trợ OCR; " +
                "vui lòng dùng PDF có thể chọn/copy chữ hoặc file DOCX.",
            422
        );
    }
    if (pageCount > 0 && meaningfulChars / Math.min(pageCount, maxPages) < 40) {
        warnings.push("Một số trang PDF gần như không có chữ (có thể là ảnh scan) — nội dung ở các trang đó có thể bị thiếu.");
    }

    return { text, pageCount, imageCount: 0, warnings };
};

// --------------------------------------------------------------- DOCX ----
// Text is read straight from word/document.xml instead of a raw-text
// converter, because quiz documents very often use Word's *automatic*
// numbering for question numbers (1., 2.) and options (A., B.) — that
// numbering is not part of the text runs and would otherwise be lost.

interface NumberingLevel {
    fmt: string;
    text: string;
    start: number;
}

interface NumberingDefinitions {
    abstractLevels: Map<string, Map<number, NumberingLevel>>;
    nums: Map<string, { abstractId: string; startOverrides: Map<number, number> }>;
}

const XML_TOKEN = /<(\/?)([A-Za-z][\w.\-]*(?::[\w.\-]+)?)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>|([^<]+)/g;

const decodeXml = (s: string): string =>
    s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity: string) => {
        const e = entity.toLowerCase();
        if (e === "amp") return "&";
        if (e === "lt") return "<";
        if (e === "gt") return ">";
        if (e === "quot") return '"';
        if (e === "apos") return "'";
        const code = e.startsWith("#x") ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    });

const attr = (attrs: string, name: string): string | undefined => {
    const match = new RegExp(`${name}="([^"]*)"`).exec(attrs);
    return match ? decodeXml(match[1]) : undefined;
};

const readZipText = async (zip: JSZip, name: string): Promise<string | null> => {
    const entry = zip.file(name);
    if (!entry) return null;
    // JSZip exposes the declared uncompressed size on its internal _data
    // object; checked before inflating so a zip bomb is never expanded.
    const declared = (entry as any)._data?.uncompressedSize;
    if (typeof declared === "number" && declared > MAX_DOCX_XML_BYTES) {
        throw new QuizSolverError("UNSUPPORTED_FILE", "File DOCX có cấu trúc bất thường (quá lớn sau giải nén).", 415);
    }
    const content = await entry.async("string");
    if (content.length > MAX_DOCX_XML_BYTES) {
        throw new QuizSolverError("UNSUPPORTED_FILE", "File DOCX có cấu trúc bất thường (quá lớn sau giải nén).", 415);
    }
    return content;
};

const parseNumbering = (xml: string | null): NumberingDefinitions => {
    const defs: NumberingDefinitions = { abstractLevels: new Map(), nums: new Map() };
    if (!xml) return defs;

    for (const abs of xml.matchAll(/<w:abstractNum\b([^>]*)>([\s\S]*?)<\/w:abstractNum>/g)) {
        const id = attr(abs[1], "w:abstractNumId");
        if (id === undefined) continue;
        const levels = new Map<number, NumberingLevel>();
        for (const lvl of abs[2].matchAll(/<w:lvl\b([^>]*)>([\s\S]*?)<\/w:lvl>/g)) {
            const ilvl = Number(attr(lvl[1], "w:ilvl") ?? "0");
            const body = lvl[2];
            const fmt = /<w:numFmt\b[^>]*w:val="([^"]*)"/.exec(body)?.[1] ?? "decimal";
            const text = decodeXml(/<w:lvlText\b[^>]*w:val="([^"]*)"/.exec(body)?.[1] ?? `%${ilvl + 1}.`);
            const start = Number(/<w:start\b[^>]*w:val="([^"]*)"/.exec(body)?.[1] ?? "1");
            levels.set(ilvl, { fmt, text, start: Number.isFinite(start) ? start : 1 });
        }
        defs.abstractLevels.set(id, levels);
    }

    for (const num of xml.matchAll(/<w:num\b([^>]*)>([\s\S]*?)<\/w:num>/g)) {
        const numId = attr(num[1], "w:numId");
        const abstractId = /<w:abstractNumId\b[^>]*w:val="([^"]*)"/.exec(num[2])?.[1];
        if (numId === undefined || abstractId === undefined) continue;
        const startOverrides = new Map<number, number>();
        for (const ov of num[2].matchAll(/<w:lvlOverride\b([^>]*)>([\s\S]*?)<\/w:lvlOverride>/g)) {
            const ilvl = Number(attr(ov[1], "w:ilvl") ?? "0");
            const start = /<w:startOverride\b[^>]*w:val="([^"]*)"/.exec(ov[2])?.[1];
            if (start !== undefined) startOverrides.set(ilvl, Number(start));
        }
        defs.nums.set(numId, { abstractId, startOverrides });
    }
    return defs;
};

// Paragraph styles can carry their own numbering (e.g. a "Question" style).
const parseStyleNumbering = (xml: string | null): Map<string, { numId: string; ilvl: number }> => {
    const map = new Map<string, { numId: string; ilvl: number }>();
    if (!xml) return map;
    for (const style of xml.matchAll(/<w:style\b([^>]*)>([\s\S]*?)<\/w:style>/g)) {
        const styleId = attr(style[1], "w:styleId");
        const numId = /<w:numId\b[^>]*w:val="([^"]*)"/.exec(style[2])?.[1];
        if (!styleId || !numId) continue;
        const ilvl = Number(/<w:ilvl\b[^>]*w:val="([^"]*)"/.exec(style[2])?.[1] ?? "0");
        map.set(styleId, { numId, ilvl });
    }
    return map;
};

const toRoman = (n: number): string => {
    const table: [number, string][] = [
        [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
        [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
    ];
    let out = "";
    for (const [value, sym] of table) {
        while (n >= value) {
            out += sym;
            n -= value;
        }
    }
    return out;
};

const toLetters = (n: number): string => {
    // Word repeats the letter past Z: 27 -> AA, 28 -> BB.
    const letter = String.fromCharCode(65 + ((n - 1) % 26));
    return letter.repeat(Math.floor((n - 1) / 26) + 1);
};

const formatCounter = (n: number, fmt: string): string => {
    switch (fmt) {
        case "upperLetter": return toLetters(n);
        case "lowerLetter": return toLetters(n).toLowerCase();
        case "upperRoman": return toRoman(n);
        case "lowerRoman": return toRoman(n).toLowerCase();
        case "decimalZero": return n < 10 ? `0${n}` : String(n);
        default: return String(n);
    }
};

class NumberingCounter {
    private counters = new Map<string, number[]>();
    private seenNumIds = new Set<string>();

    constructor(private defs: NumberingDefinitions) {}

    // Returns the rendered list label for a numbered paragraph (e.g. "3. ",
    // "B. ", "Câu 4: "), advancing Word's per-list counters.
    next(numId: string, ilvl: number): string {
        const num = this.defs.nums.get(numId);
        if (!num) return "";
        const levels = this.defs.abstractLevels.get(num.abstractId);
        const level = levels?.get(ilvl);
        if (!levels || !level || level.fmt === "none") return "";

        const counts = this.counters.get(num.abstractId) ?? [];
        if (!this.seenNumIds.has(numId)) {
            this.seenNumIds.add(numId);
            for (const [lvl, start] of num.startOverrides) counts[lvl] = start - 1;
        }
        counts[ilvl] = (counts[ilvl] ?? level.start - 1) + 1;
        counts.length = ilvl + 1; // deeper levels restart under a new parent item
        this.counters.set(num.abstractId, counts);

        if (level.fmt === "bullet") return "• ";
        const label = level.text.replace(/%(\d)/g, (_, d: string) => {
            const idx = Number(d) - 1;
            const lvl = levels.get(idx);
            return formatCounter(counts[idx] ?? lvl?.start ?? 1, lvl?.fmt ?? "decimal");
        });
        return `${label} `;
    }
}

interface ParagraphState {
    text: string;
    numId?: string;
    ilvl: number;
    styleId?: string;
}

interface TableState {
    row: string[];
    cell: string[];
}

// Exported for tests. Converts word/document.xml to plain text, one line per
// paragraph, table rows as "cell | cell", images as a "[Hình ảnh]" marker.
export const docxXmlToText = (
    documentXml: string,
    numberingXml: string | null,
    stylesXml: string | null
): { text: string; imageCount: number; tableCount: number } => {
    const numbering = new NumberingCounter(parseNumbering(numberingXml));
    const styleNumbering = parseStyleNumbering(stylesXml);
    const body: string[] = [];
    const paragraphs: ParagraphState[] = [];
    const tables: TableState[] = [];
    let imageCount = 0;
    let tableCount = 0;
    let textDepth = 0; // inside <w:t>/<m:t>
    let skipDepth = 0; // inside content that must be ignored
    let pPrDepth = 0;
    // Ignored subtrees: alternate-content fallbacks (duplicate of the main
    // content), field codes, deleted text and tracked-change history.
    const SKIP = new Set(["mc:Fallback", "w:instrText", "w:delText", "w:pPrChange", "w:rPrChange", "w:footnoteReference"]);

    const container = (): string[] => (tables.length ? tables[tables.length - 1].cell : body);
    const current = (): ParagraphState | undefined => paragraphs[paragraphs.length - 1];

    const closeParagraph = () => {
        const p = paragraphs.pop();
        if (!p) return;
        let numId = p.numId;
        let ilvl = p.ilvl;
        if (numId === undefined && p.styleId && styleNumbering.has(p.styleId)) {
            numId = styleNumbering.get(p.styleId)!.numId;
            ilvl = styleNumbering.get(p.styleId)!.ilvl;
        }
        const prefix = numId && numId !== "0" ? numbering.next(numId, ilvl) : "";
        container().push((prefix + p.text).replace(/[ \t]+$/g, ""));
    };

    XML_TOKEN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = XML_TOKEN.exec(documentXml))) {
        const [, closing, tag, attrs, selfClosing, text] = m;

        if (text !== undefined) {
            if (textDepth > 0 && skipDepth === 0 && current()) current()!.text += decodeXml(text);
            continue;
        }

        if (SKIP.has(tag)) {
            if (!selfClosing) skipDepth += closing ? -1 : 1;
            continue;
        }
        if (skipDepth > 0) continue;

        if (closing) {
            switch (tag) {
                case "w:t":
                case "m:t":
                    textDepth = Math.max(0, textDepth - 1);
                    break;
                case "w:pPr":
                    pPrDepth = Math.max(0, pPrDepth - 1);
                    break;
                case "w:p":
                    closeParagraph();
                    break;
                case "w:tc": {
                    const t = tables[tables.length - 1];
                    if (t) {
                        t.row.push(t.cell.join(" ").trim());
                        t.cell = [];
                    }
                    break;
                }
                case "w:tr": {
                    const t = tables[tables.length - 1];
                    if (t) {
                        const row = t.row.filter(Boolean).join(" | ");
                        t.row = [];
                        tables.pop();
                        if (row) container().push(row);
                        tables.push(t);
                    }
                    break;
                }
                case "w:tbl":
                    tables.pop();
                    break;
            }
            continue;
        }

        switch (tag) {
            case "w:t":
            case "m:t":
                if (!selfClosing) textDepth++;
                break;
            case "w:p":
                if (selfClosing) container().push("");
                else paragraphs.push({ text: "", ilvl: 0 });
                break;
            case "w:pPr":
                if (!selfClosing) pPrDepth++;
                break;
            case "w:numId":
                if (pPrDepth > 0 && current()) current()!.numId = attr(attrs, "w:val");
                break;
            case "w:ilvl":
                if (pPrDepth > 0 && current()) current()!.ilvl = Number(attr(attrs, "w:val") ?? "0");
                break;
            case "w:pStyle":
                if (pPrDepth > 0 && current()) current()!.styleId = attr(attrs, "w:val");
                break;
            case "w:tab":
                // <w:tab> inside <w:pPr><w:tabs> is a tab-stop definition, not text.
                if (pPrDepth === 0 && current()) current()!.text += "\t";
                break;
            case "w:br":
            case "w:cr":
                if (current()) current()!.text += "\n";
                break;
            case "a:blip":
            case "v:imagedata":
                imageCount++;
                if (current()) current()!.text += " [Hình ảnh] ";
                break;
            case "w:tbl":
                tableCount++;
                tables.push({ row: [], cell: [] });
                break;
        }
    }
    while (paragraphs.length) closeParagraph();

    return { text: body.join("\n"), imageCount, tableCount };
};

const extractDocxText = async (buffer: Buffer): Promise<ExtractedQuizText> => {
    let zip: JSZip;
    try {
        zip = await JSZip.loadAsync(buffer);
    } catch {
        throw new QuizSolverError("CORRUPT_FILE", "Không đọc được file DOCX (file có thể bị hỏng).", 422);
    }

    const contentTypes = await readZipText(zip, "[Content_Types].xml");
    const documentXml = await readZipText(zip, "word/document.xml");
    if (!contentTypes || !documentXml) {
        throw new QuizSolverError("CORRUPT_FILE", "File không phải tài liệu Word (.docx) hợp lệ.", 422);
    }
    // Macro-enabled documents/templates renamed to .docx are rejected —
    // nothing in the file is ever executed, but they're not supported input.
    if (zip.file("word/vbaProject.bin") || !contentTypes.includes("wordprocessingml.document.main+xml")) {
        throw new QuizSolverError("UNSUPPORTED_FILE", "Chỉ hỗ trợ file Word (.docx) thông thường, không hỗ trợ file có macro.", 415);
    }

    const [numberingXml, stylesXml] = await Promise.all([
        readZipText(zip, "word/numbering.xml"),
        readZipText(zip, "word/styles.xml"),
    ]);

    let parsed: ReturnType<typeof docxXmlToText>;
    try {
        parsed = docxXmlToText(documentXml, numberingXml, stylesXml);
    } catch {
        throw new QuizSolverError("CORRUPT_FILE", "Không đọc được nội dung file DOCX.", 422);
    }

    const warnings: string[] = [];
    if (parsed.imageCount > 0) {
        warnings.push(
            `Tài liệu có ${parsed.imageCount} hình ảnh. Hệ thống chưa đọc được nội dung hình ảnh — ` +
                "các câu phụ thuộc vào hình sẽ được đánh dấu cần kiểm tra."
        );
    }
    if (parsed.tableCount > 0) {
        warnings.push("Tài liệu có bảng; nội dung bảng được chuyển thành dạng dòng \"ô | ô\" — hãy kiểm tra lại các câu liên quan.");
    }
    if (parsed.text.replace(/\s+|\[Hình ảnh\]/g, "").length < 10) {
        throw new QuizSolverError(
            "NO_TEXT",
            "File DOCX không có nội dung văn bản đọc được (có thể đề chỉ gồm hình ảnh).",
            422
        );
    }
    return { text: parsed.text, imageCount: parsed.imageCount, warnings };
};
