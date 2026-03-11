import re
import unicodedata
from langchain_core.documents import Document

WHITESPACE_RE = re.compile(r"\s+")
CONTROL_RE = re.compile(r"[\u0000-\u001F\u007F-\u009F]")

# Markdown / rich-text artefacts
MARKDOWN_LINK_RE = re.compile(r"\[([^\]]*)\]\([^\)]*\)")       
MARKDOWN_IMG_RE = re.compile(r"!\[([^\]]*)\]\([^\)]*\)")       
HTML_TAG_RE = re.compile(r"<[^>]+>")                           
HEADING_PREFIX_RE = re.compile(r"(?m)^\s*#{1,6}\s+")            
BULLET_PREFIX_RE = re.compile(
    r"(?m)^\s*(?:[-*+•▪▫◦‣⁃►→➤➜■□▶●○]\s+|\d+[\.\)]\s+)"
)
MARKDOWN_BOLD_ITALIC_RE = re.compile(r"\*{1,3}(.+?)\*{1,3}")    
MARKDOWN_UNDERSCORE_RE = re.compile(r"_{1,3}(.+?)_{1,3}")     
MARKDOWN_STRIKE_RE = re.compile(r"~~(.+?)~~")                   
MARKDOWN_INLINE_CODE_RE = re.compile(r"`(.+?)`")                
MARKDOWN_FENCE_RE = re.compile(r"```[\s\S]*?```")               
HORIZONTAL_RULE_RE = re.compile(r"(?m)^\s*[-*_]{3,}\s*$")       

# Symbols & decorations often found in extracted PDFs
DECORATION_RE = re.compile(
    r"[*_~`#>|\\^{}◆◇★☆✦✧✩✪✫✬✭✮✯✰⭐✓✔✕✖✗✘✚✛✜✝✞✟†‡§¶©®™°±≈≠≤≥÷×∞∑∏∫√∂∆∇«»""''‹›„‚❝❞❛❜❖]"
)

# Leftover reference-style numbers like [1], [23], (1), (23)
REF_BRACKET_RE = re.compile(r"\[\d+\]|\(\d+\)")

# Repeated punctuation / filler patterns
REPEATED_PUNCT_RE = re.compile(r"([.\-=_/\\:;,!?])\1{2,}")
ELLIPSIS_DOTS_RE = re.compile(r"\.{4,}")

# Lines that are just page numbers, headers, footers
PAGE_NUMBER_RE = re.compile(r"(?m)^\s*\d{1,4}\s*$")
SHORT_JUNK_LINE_RE = re.compile(r"(?m)^\s*.{0,2}\s*$")


def clean_text(text: str) -> str:
    """Turn raw extracted text into clean, symbol-free plain text."""

    # 1. Unicode normalisation
    text = unicodedata.normalize("NFKC", text)
    text = CONTROL_RE.sub(" ", text)

    # 2. Strip fenced code blocks first (multi-line)
    text = MARKDOWN_FENCE_RE.sub(" ", text)

    # 3. Markdown / HTML → plain text (keep inner content)
    text = MARKDOWN_IMG_RE.sub(r"\1", text)
    text = MARKDOWN_LINK_RE.sub(r"\1", text)
    text = HTML_TAG_RE.sub(" ", text)
    text = HEADING_PREFIX_RE.sub("", text)
    text = BULLET_PREFIX_RE.sub("", text)
    text = HORIZONTAL_RULE_RE.sub(" ", text)
    text = MARKDOWN_BOLD_ITALIC_RE.sub(r"\1", text)
    text = MARKDOWN_UNDERSCORE_RE.sub(r"\1", text)
    text = MARKDOWN_STRIKE_RE.sub(r"\1", text)
    text = MARKDOWN_INLINE_CODE_RE.sub(r"\1", text)

    # 4. Decorative symbols, stray pipes, brackets
    text = DECORATION_RE.sub(" ", text)
    text = REF_BRACKET_RE.sub(" ", text)

    # 5. Repeated punctuation / ellipsis noise
    text = ELLIPSIS_DOTS_RE.sub("...", text)
    text = REPEATED_PUNCT_RE.sub(r"\1", text)

    # 6. Page-number-only lines & very short junk lines
    text = PAGE_NUMBER_RE.sub("", text)
    text = SHORT_JUNK_LINE_RE.sub("", text)

    # 7. Collapse whitespace
    text = WHITESPACE_RE.sub(" ", text)
    return text.strip()


def clean_documents(documents: list[Document]) -> list[Document]:
    cleaned: list[Document] = []
    for doc in documents:
        ct = clean_text(doc.page_content)
        if ct:
            cleaned.append(
                Document(page_content=ct, metadata=dict(doc.metadata))
            )
    return cleaned
