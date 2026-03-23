from __future__ import annotations

import csv
import json
import re
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SOURCE_DIR = ROOT / "camera_2022"
DATA_DIR = ROOT / "data"

CDX_PATTERNS = [
    "fratelli d'italia",
    "forza italia",
    "lega",
    "noi moderati",
]

CSXM5S_PATTERNS = [
    "partito democratico",
    "alleanza verdi e sinistra",
    "alleanza sinistra verdi",
    "piu europa",
    "+europa",
    "impegno civico",
    "azione italia viva",
    "movimento 5 stelle",
]


def normalize_text(value: str) -> str:
    text = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    text = re.sub(r"[\-_/]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


def parse_number(value: str | None) -> float | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    if text.lower() in {"#div/0!", "inf", "-inf", "nan"}:
        return None
    if "," in text and "." in text:
        if text.rfind(",") > text.rfind("."):
            text = text.replace(".", "").replace(",", ".")
        else:
            text = text.replace(",", "")
    elif "," in text:
        text = text.replace(".", "").replace(",", ".")
    return float(text)


def find_column(headers: list[str], pattern: str) -> str | None:
    for header in headers:
        if pattern in normalize_text(header):
            return header
    return None


def sum_columns(row: dict[str, str], headers: list[str], patterns: list[str]) -> float:
    total = 0.0
    for pattern in patterns:
        header = find_column(headers, pattern)
        if header is None:
            continue
        total += parse_number(row.get(header)) or 0.0
    return total


def city_slug_from_filename(path: Path) -> str:
    return path.stem.replace("_camera_2022", "").lower()


def build_city_payload(csv_path: Path) -> dict:
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        headers = reader.fieldnames or []
        rows = list(reader)

    section_header = find_column(headers, "sezione")
    total_header = find_column(headers, "totale")
    turnout_header = find_column(headers, "affluenza")

    if section_header is None or total_header is None:
        raise ValueError(f"CSV non riconosciuto: {csv_path.name}")

    sections = []
    for row in rows:
        section_raw = row.get(section_header)
        if section_raw is None:
            continue

        section_text = str(section_raw).strip()
        if not section_text.isdigit():
            continue

        total_votes = parse_number(row.get(total_header)) or 0.0
        if total_votes <= 0:
            continue

        cdx_votes = sum_columns(row, headers, CDX_PATTERNS)
        csxm5s_votes = sum_columns(row, headers, CSXM5S_PATTERNS)
        turnout = parse_number(row.get(turnout_header))
        turnout_pct = turnout * 100 if turnout is not None and turnout <= 1 else turnout

        sections.append(
            {
                "section": int(section_text),
                "politiche2022": {
                    "cdx_votes": cdx_votes,
                    "cdx_pct": cdx_votes / total_votes * 100,
                    "csxm5s_votes": csxm5s_votes,
                    "csxm5s_pct": csxm5s_votes / total_votes * 100,
                    "total_votes": total_votes,
                    "turnout": turnout_pct,
                },
            }
        )

    return {
        "city": city_slug_from_filename(csv_path),
        "updated_at": "2022-09-25T23:00:00+02:00",
        "coalitions": {
            "cdx": "Fratelli d'Italia + Lega + Forza Italia + Noi Moderati",
            "csxm5s": "Partito Democratico + Alleanza Verdi e Sinistra + +Europa + Impegno Civico + Azione/Italia Viva + Movimento 5 Stelle",
        },
        "sections": sections,
    }


def main() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    exported = []

    for csv_path in sorted(SOURCE_DIR.glob("*_camera_2022.csv")):
        payload = build_city_payload(csv_path)
        out_path = DATA_DIR / f"politiche2022_{payload['city']}.json"
        out_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        exported.append({"city": payload["city"], "sections": len(payload["sections"]), "file": out_path.name})

    print(json.dumps(exported, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
