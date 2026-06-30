#!/usr/bin/env python3
"""
fix_and_apply.py  —  Applies scripts 4-10 by reading .ps1 files
and writing clean .tsx files (bypasses all PowerShell quoting bugs).

USAGE:
  1. Place this Python script AND all 7 .ps1 files in the SAME folder.
  2. Open a terminal in that folder.
  3. Run:  python fix_and_apply.py "D:\\path\\to\\your\\react-project"
     (or just  python fix_and_apply.py  if the .ps1 files are inside the project)
"""
import os, sys, re

# ── Configuration ──────────────────────────────────────────────────
base = sys.argv[1] if len(sys.argv) > 1 else "."
script_dir = os.path.dirname(os.path.abspath(__file__))

MAPPING = [
    ("script4_invoices.ps1",  "src/components/tracker/TabInvoices.tsx"),
    ("script5_settings.ps1",  "src/components/tracker/TabSettings.tsx"),
    ("script6_parties.ps1",   "src/components/tracker/TabParties.tsx"),
    ("script7_items.ps1",     "src/components/tracker/TabItems.tsx"),
    ("script8_expenses.ps1",  "src/components/tracker/TabExpenses.tsx"),
    ("script9_cashbook.ps1",  "src/components/tracker/TabCashBook.tsx"),
    ("script10_dashboard.ps1","src/components/tracker/TabDashboard.tsx"),
]

# ── Helpers ────────────────────────────────────────────────────────
def extract_tsx(ps_content, ps_name):
    """Parse a PS1 line-array script and return clean TSX content."""
    # Match: $lines = @( ... )\n\n[  (the ) before [System.IO.File]
    m = re.search(
        r"\$lines\s*=\s*@\(\s*\n(.*?)\n\s*\)\s*\n\s*\[",
        ps_content,
        re.DOTALL,
    )
    if not m:
        raise ValueError(f"Could not find $lines array in {ps_name}")

    raw_block = m.group(1)
    tsx_lines = []

    for raw_line in raw_block.split("\n"):
        stripped = raw_line.strip()

        # Blank line → keep as empty
        if not stripped:
            tsx_lines.append("")
            continue

        # ── Strip PowerShell single-quote wrapping ──
        #    Pattern A: 'content',
        #    Pattern B: 'content'
        if stripped.startswith("'") and stripped.endswith("',"):
            line = stripped[1:-2]
        elif stripped.startswith("'") and stripped.endswith("'"):
            line = stripped[1:-1]
        else:
            line = stripped

        # ── Fix stray single-quote before JSX closing tags ──
        #    Bug:  '              '</tbody>',   (PS1 closes string early)
        #    Fix:  '              </tbody>',
        #    We match: whitespace + ' + optional-space + </
        line = re.sub(r"(\s)'(\s*</)", r"\1\2", line)

        # ── Fix PS1 escaped single-quotes ('' → ') ──
        line = line.replace("''", "'")

        tsx_lines.append(line)

    tsx = "\n".join(tsx_lines)

    # ── Fix double-escaped backslash sequences from PS1 ──
    #    PS1 single-quoted strings: \\n is literal \\n (3 chars)
    #    We want the TSX file to contain: \n (2 chars) so JS
    #    interprets it as newline/tab in template literals & splits.
    tsx = tsx.replace("\\\\n", "\\n")
    tsx = tsx.replace("\\\\t", "\\t")

    return tsx


def write_tsx(rel_path, content):
    """Write TSX content to the correct path under base dir."""
    parts = rel_path.replace("/", os.sep).split(os.sep)
    full = os.path.join(base, *parts)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="") as f:
        f.write(content.strip() + "\n")
    line_count = content.strip().count("\n") + 1
    return line_count


# ── Main ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("  Applying Scripts 4-10  (Python PS1 extractor)")
    print("=" * 55)
    print(f"  Base : {os.path.abspath(base)}")
    print(f"  PS1s : {script_dir}")
    print()

    ok = 0
    errors = []

    for ps_name, tsx_rel in MAPPING:
        ps_path = os.path.join(script_dir, ps_name)

        if not os.path.exists(ps_path):
            errors.append(f"  NOT FOUND : {ps_name}")
            continue

        try:
            with open(ps_path, "r", encoding="utf-8") as f:
                ps_content = f.read()

            tsx = extract_tsx(ps_content, ps_name)
            n = write_tsx(tsx_rel, tsx)
            print(f"  OK ({n:4d} lines) : {tsx_rel}")
            ok += 1

        except Exception as e:
            errors.append(f"  ERROR [{ps_name}] : {e}")

    print()
    print("=" * 55)
    print(f"  Result: {ok}/{len(MAPPING)} files written")
    if errors:
        print()
        for e in errors:
            print(e)
    print("=" * 55)

    if ok == len(MAPPING):
        print("\n  All done! Run npm run dev to test.")
    elif ok > 0:
        print(f"\n  {ok} files OK. Fix the errors above and re-run.")
    else:
        print("\n  Nothing applied. Check that .ps1 files are in:")
        print(f"    {script_dir}")