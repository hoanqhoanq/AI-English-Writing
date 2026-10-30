import { test } from "node:test";
import assert from "node:assert/strict";
import {
    detectQuizFileType,
    extractQuizText,
    safeDisplayName,
    UploadedQuizFile,
} from "../../src/modules/quiz-solver/quiz-file.service";
import { QuizSolverError } from "../../src/modules/quiz-solver/quiz-solver.errors";
import { config } from "../../src/config/env";
import { makeDocx, makePdf, SAMPLE_QUIZ_LINES } from "./fixtures";

const file = (originalname: string, buffer: Buffer, mimetype = ""): UploadedQuizFile => ({
    originalname,
    mimetype,
    size: buffer.length,
    buffer,
});

const rejectsWith = (fn: () => unknown, code: string) =>
    assert.throws(fn, (err: any) => err instanceof QuizSolverError && err.code === code);

const rejectsAsync = async (p: Promise<unknown>, code: string) =>
    assert.rejects(p, (err: any) => err instanceof QuizSolverError && err.code === code);

test("accepts real PDF and DOCX by magic bytes", async () => {
    assert.equal(detectQuizFileType(file("de.pdf", makePdf(["x"]), "application/pdf")), "pdf");
    assert.equal(
        detectQuizFileType(file("de.docx", await makeDocx([{ text: "x" }]), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")),
        "docx"
    );
    // Generic/empty MIME from the browser is fine — bytes decide.
    assert.equal(detectQuizFileType(file("de.pdf", makePdf(["x"]), "application/octet-stream")), "pdf");
});

test("rejects unsupported extensions, spoofed extensions and wrong MIME", () => {
    rejectsWith(() => detectQuizFileType(file("virus.exe", Buffer.from("MZ\x90\x00"))), "UNSUPPORTED_FILE");
    rejectsWith(() => detectQuizFileType(file("notes.txt", Buffer.from("hello"))), "UNSUPPORTED_FILE");
    // .pdf extension but PNG bytes.
    rejectsWith(() => detectQuizFileType(file("fake.pdf", Buffer.from("\x89PNG\r\n\x1a\n0000", "latin1"))), "UNSUPPORTED_FILE");
    // .docx extension but plain text.
    rejectsWith(() => detectQuizFileType(file("fake.docx", Buffer.from("not a zip file"))), "UNSUPPORTED_FILE");
    // Real PDF bytes declared as an image.
    rejectsWith(() => detectQuizFileType(file("de.pdf", makePdf(["x"]), "image/png")), "UNSUPPORTED_FILE");
});

test("rejects empty and oversized files", () => {
    rejectsWith(() => detectQuizFileType(file("empty.pdf", Buffer.alloc(0))), "EMPTY_FILE");
    const big = Buffer.alloc(Math.round(config.quizSolver.maxFileMb * 1024 * 1024) + 1);
    big.write("%PDF-1.4");
    rejectsWith(() => detectQuizFileType(file("big.pdf", big)), "FILE_TOO_LARGE");
});

test("extracts text from a PDF with a text layer", async () => {
    const out = await extractQuizText(makePdf(SAMPLE_QUIZ_LINES), "pdf");
    assert.match(out.text, /Question 1\. She _____ to school every day\./);
    assert.match(out.text, /D\. plays/);
    assert.equal(out.pageCount, 1);
});

test("PDF without text (scan) and corrupt PDF give controlled errors", async () => {
    await rejectsAsync(extractQuizText(makePdf([]), "pdf"), "SCANNED_PDF");
    await rejectsAsync(extractQuizText(Buffer.from("%PDF-1.4\n garbage garbage"), "pdf"), "CORRUPT_FILE");
});

test("extracts DOCX text including Word automatic numbering, images and tables", async () => {
    const docx = await makeDocx(
        [
            { text: "Choose the best answer." },
            { text: "She _____ to school.", numId: 1 },
            { text: "go", numId: 1, ilvl: 1 },
            { text: "goes", numId: 1, ilvl: 1 },
            { text: "Look at the picture. What is it?", numId: 1, image: true },
            { text: "cat", numId: 1, ilvl: 1 },
            { text: "dog", numId: 1, ilvl: 1 },
        ],
        { table: [["word", "meaning"]] }
    );
    const out = await extractQuizText(docx, "docx");
    const lines = out.text.split("\n");
    assert.deepEqual(lines.slice(0, 7), [
        "Choose the best answer.",
        "1. She _____ to school.",
        "A. go",
        "B. goes",
        "2. Look at the picture. What is it? [Hình ảnh]",
        "A. cat",
        "B. dog",
    ]);
    assert.equal(lines[7], "word | meaning");
    assert.equal(out.imageCount, 1);
    assert.ok(out.warnings.some((w) => w.includes("hình ảnh")));
});

test("corrupt, non-Word and macro DOCX are rejected", async () => {
    await rejectsAsync(extractQuizText(Buffer.from("PK\x03\x04 broken zip", "latin1"), "docx"), "CORRUPT_FILE");
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    zip.file("hello.txt", "not word");
    await rejectsAsync(extractQuizText(await zip.generateAsync({ type: "nodebuffer" }), "docx"), "CORRUPT_FILE");
    await rejectsAsync(extractQuizText(await makeDocx([{ text: "1. x" }], { macro: true }), "docx"), "UNSUPPORTED_FILE");
    await rejectsAsync(extractQuizText(await makeDocx([{ text: "" }]), "docx"), "NO_TEXT");
});

test("display name is sanitized and never a path", () => {
    assert.equal(safeDisplayName("../../etc/passwd.pdf"), "passwd.pdf");
    assert.equal(safeDisplayName("C:\\Windows\\de.docx"), "de.docx");
    // multer delivers UTF-8 names decoded as latin1.
    assert.equal(safeDisplayName(Buffer.from("Đề thi.pdf", "utf8").toString("latin1")), "Đề thi.pdf");
});
