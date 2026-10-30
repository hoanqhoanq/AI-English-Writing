// Test-only builders for real (tiny) PDF and DOCX files, so extraction is
// tested against genuine documents instead of mocks.
import JSZip from "jszip";
import { AIProvider, IRawJsonOptions } from "../../src/modules/ai/ai.interface";

const escapePdfText = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

// Builds a one-page PDF with a real text layer (Helvetica, one line per entry).
export const makePdf = (lines: string[]): Buffer => {
    const content = `BT /F1 11 Tf 50 780 Td 14 TL\n${lines.map((l) => `(${escapePdfText(l)}) Tj T*`).join("\n")}\nET`;
    const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    ];
    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [];
    objects.forEach((obj, i) => {
        offsets.push(Buffer.byteLength(pdf, "latin1"));
        pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
    });
    const xrefOffset = Buffer.byteLength(pdf, "latin1");
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    return Buffer.from(pdf, "latin1");
};

export interface DocxParagraph {
    text: string;
    numId?: number;
    ilvl?: number;
    image?: boolean;
}

const xmlEscape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// numId 1 = "1." decimal list (level 0) with "A." upper-letter sub-list (level 1).
const NUMBERING_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:abstractNum w:abstractNumId="0">
<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl>
<w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="upperLetter"/><w:lvlText w:val="%2."/></w:lvl>
</w:abstractNum>
<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>`;

export const makeDocx = async (
    paragraphs: DocxParagraph[],
    options: { macro?: boolean; table?: string[][] } = {}
): Promise<Buffer> => {
    const zip = new JSZip();
    const mainType = options.macro
        ? "application/vnd.ms-word.document.macroEnabled.main+xml"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
    zip.file(
        "[Content_Types].xml",
        `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
            `<Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="${mainType}"/></Types>`
    );
    const body = paragraphs
        .map((p) => {
            const numPr = p.numId ? `<w:pPr><w:numPr><w:ilvl w:val="${p.ilvl ?? 0}"/><w:numId w:val="${p.numId}"/></w:numPr></w:pPr>` : "";
            const image = p.image ? `<w:r><w:drawing><a:graphic><a:graphicData><pic:pic><pic:blipFill><a:blip r:embed="rId9"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></w:drawing></w:r>` : "";
            return `<w:p>${numPr}<w:r><w:t xml:space="preserve">${xmlEscape(p.text)}</w:t></w:r>${image}</w:p>`;
        })
        .join("");
    const table = options.table
        ? `<w:tbl>${options.table.map((row) => `<w:tr>${row.map((cell) => `<w:tc><w:p><w:r><w:t>${xmlEscape(cell)}</w:t></w:r></w:p></w:tc>`).join("")}</w:tr>`).join("")}</w:tbl>`
        : "";
    zip.file(
        "word/document.xml",
        `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ` +
            `xmlns:a="a" xmlns:pic="pic" xmlns:r="r"><w:body>${body}${table}</w:body></w:document>`
    );
    zip.file("word/numbering.xml", NUMBERING_XML);
    if (options.macro) zip.file("word/vbaProject.bin", "fake");
    return zip.generateAsync({ type: "nodebuffer" });
};

// Test-layer stand-in for a real AI provider (never used in production):
// `respond` receives each prompt and returns the raw JSON text or throws.
export class FakeQuizProvider implements AIProvider {
    readonly name = "fake";
    calls: string[] = [];
    constructor(private respond: (prompt: string, call: number, options: IRawJsonOptions) => Promise<string> | string) {}

    async generateJson(prompt: string, options: IRawJsonOptions): Promise<string> {
        this.calls.push(prompt);
        return this.respond(prompt, this.calls.length, options);
    }

    generateWritingQuestions(): never { throw new Error("not used"); }
    evaluateWriting(): never { throw new Error("not used"); }
    analyzeWeakness(): never { throw new Error("not used"); }
    evaluateParagraph(): never { throw new Error("not used"); }
    generateParagraphPrompt(): never { throw new Error("not used"); }
    generateQuizQuestions(): never { throw new Error("not used"); }
}

// Answers every "Q<n>" in the prompt with option B.
export const answerAllWithB = (prompt: string): string => {
    const numbers = [...prompt.matchAll(/^Q(\d+)/gm)].map((m) => Number(m[1]));
    return JSON.stringify({
        answers: numbers.map((number) => ({ number, answer: "B", explanation: "Giải thích.", confidence: "high", needsReview: false })),
    });
};

export const SAMPLE_QUIZ_LINES = [
    "Choose the correct answer.",
    "Question 1. She _____ to school every day.",
    "A. go B. goes C. going D. gone",
    "Question 2. They _____ football yesterday.",
    "A. play",
    "B. played",
    "C. playing",
    "D. plays",
];
