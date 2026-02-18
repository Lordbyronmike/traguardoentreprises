#!/usr/bin/env python3
"""
Synchronise les donnees reglementaires "Bilan de competences" depuis Legifrance
vers assets/data/bilan-cpf-reglementation.json.

Usage:
  python3 scripts/sync_legifrance_bilan.py
  python3 scripts/sync_legifrance_bilan.py --output /tmp/bilan.json
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import html
import json
import pathlib
import re
import sys
import unicodedata
import urllib.request
from typing import Any


DEFAULT_OUTPUT = "assets/data/bilan-cpf-reglementation.json"
DEFAULT_ARRETE_URL = "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000050935023"
DEFAULT_CODE_URL = "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038878296"
USER_AGENT = "TraguardoLegifranceSync/1.0"


UNITS = {
    "zero": 0,
    "un": 1,
    "une": 1,
    "deux": 2,
    "trois": 3,
    "quatre": 4,
    "cinq": 5,
    "six": 6,
    "sept": 7,
    "huit": 8,
    "neuf": 9,
    "dix": 10,
    "onze": 11,
    "douze": 12,
    "treize": 13,
    "quatorze": 14,
    "quinze": 15,
    "seize": 16,
    "dixsept": 17,
    "dixhuit": 18,
    "dixneuf": 19,
}

TENS = {
    "vingt": 20,
    "trente": 30,
    "quarante": 40,
    "cinquante": 50,
    "soixante": 60,
}


def normalize_text(value: str) -> str:
    value = value.lower().replace("’", "'").replace("-", " ")
    value = unicodedata.normalize("NFD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = value.replace("'", " ")
    value = re.sub(r"[^a-z0-9\s]", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def fetch_html(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept-Language": "fr-FR,fr;q=0.9",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def html_to_text(raw_html: str) -> str:
    cleaned = re.sub(r"<script\b[^>]*>.*?</script>", " ", raw_html, flags=re.I | re.S)
    cleaned = re.sub(r"<style\b[^>]*>.*?</style>", " ", cleaned, flags=re.I | re.S)
    cleaned = re.sub(r"<[^>]+>", " ", cleaned)
    cleaned = html.unescape(cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def short_fingerprint(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:20]


def extract_last_update(text: str) -> str:
    m = re.search(
        r"Derniere mise a jour des donnees de ce texte\s*:\s*([0-9]{1,2}\s+[a-z]+\s+[0-9]{4})",
        normalize_text(text),
        flags=re.I,
    )
    return m.group(1) if m else ""


def french_words_to_int(text: str) -> int:
    tokens = [tok for tok in normalize_text(text).split(" ") if tok]
    if not tokens:
        return 0

    # recompose "dix sept" -> "dixsept" etc.
    merged: list[str] = []
    i = 0
    while i < len(tokens):
        if tokens[i] == "dix" and i + 1 < len(tokens) and tokens[i + 1] in {
            "sept",
            "huit",
            "neuf",
        }:
            merged.append(f"dix{tokens[i + 1]}")
            i += 2
            continue
        merged.append(tokens[i])
        i += 1
    tokens = [t for t in merged if t not in {"de", "des", "du", "la", "le", "et"}]

    total = 0
    current = 0
    i = 0
    while i < len(tokens):
        word = tokens[i]

        if word in UNITS:
            current += UNITS[word]
            i += 1
            continue

        if word in TENS:
            value = TENS[word]
            if i + 1 < len(tokens) and tokens[i + 1] in UNITS and UNITS[tokens[i + 1]] < 10:
                value += UNITS[tokens[i + 1]]
                i += 1
            current += value
            i += 1
            continue

        if word == "quatre" and i + 1 < len(tokens) and tokens[i + 1] == "vingt":
            value = 80
            if i + 2 < len(tokens) and tokens[i + 2] in UNITS and UNITS[tokens[i + 2]] < 10:
                value += UNITS[tokens[i + 2]]
                i += 1
            current += value
            i += 2
            continue

        if word in {"cent", "cents"}:
            if current == 0:
                current = 1
            current *= 100
            i += 1
            continue

        if word == "mille":
            if current == 0:
                current = 1
            total += current * 1000
            current = 0
            i += 1
            continue

        i += 1

    return total + current


def parse_participation_phrase(text: str) -> tuple[float | None, str]:
    pattern = re.compile(
        r"est fix[éee]e?\s+à\s+la\s+somme\s+forfaitaire\s+de\s+([^\.]+)\.",
        flags=re.I,
    )
    m = pattern.search(text)
    if not m:
        return None, ""

    raw_phrase = m.group(1).strip()
    normalized = normalize_text(raw_phrase)

    # 1) Essaie d'abord en numerique direct
    euro_num = None
    cent_num = 0
    euro_match = re.search(r"([0-9]+(?:[.,][0-9]+)?)\s*euro", normalized)
    if euro_match:
        euro_num = float(euro_match.group(1).replace(",", "."))
    else:
        euro_words = normalized.split("euro")[0]
        euro_num = float(french_words_to_int(euro_words))

    if "centime" in normalized:
        cent_chunk = normalized.split("euro", 1)[-1].split("centime", 1)[0]
        cent_match = re.search(r"([0-9]+)", cent_chunk)
        if cent_match:
            cent_num = int(cent_match.group(1))
        else:
            cent_num = french_words_to_int(cent_chunk)

    if euro_num is None:
        return None, raw_phrase

    value = round(float(euro_num) + (int(cent_num) / 100.0), 2)
    return value, raw_phrase


def format_eur(value: float) -> str:
    return f"{value:,.2f}".replace(",", " ").replace(".", ",") + " €"


def load_json(path: pathlib.Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def build_source_entry(src_id: str, label: str, url: str) -> dict[str, Any]:
    raw_html = fetch_html(url)
    text = html_to_text(raw_html)
    return {
        "id": src_id,
        "label": label,
        "url": url,
        "last_update": extract_last_update(text),
        "fingerprint": short_fingerprint(text),
        "text": text,
    }


def source_changed(previous: dict[str, Any], current: dict[str, Any]) -> bool:
    if not previous:
        return False
    prev_fp = previous.get("fingerprint", "")
    prev_date = previous.get("last_update", "")
    return (prev_fp and prev_fp != current.get("fingerprint", "")) or (
        prev_date and prev_date != current.get("last_update", "")
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help="Fichier JSON de sortie.")
    parser.add_argument(
        "--arrete-url",
        default=DEFAULT_ARRETE_URL,
        help="URL Legifrance de l'arrete annuel de revalorisation CPF.",
    )
    parser.add_argument(
        "--code-url",
        default=DEFAULT_CODE_URL,
        help="URL Legifrance d'un article du Code du travail lie au CPF.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Affiche le JSON sans ecrire le fichier.")
    args = parser.parse_args()

    output_path = pathlib.Path(args.output)
    existing = load_json(output_path)
    previous_sources = {s.get("id"): s for s in existing.get("sources", []) if isinstance(s, dict)}

    arrete = build_source_entry(
        "arrete_revalorisation",
        "Arrete annuel de revalorisation de la participation CPF",
        args.arrete_url,
    )
    code = build_source_entry(
        "code_travail_cpf",
        "Code du travail (CPF)",
        args.code_url,
    )

    participation_value, participation_raw = parse_participation_phrase(arrete["text"])
    cpf_participation = existing.get("cpf_participation", {})
    warnings: list[str] = []
    if participation_value is not None:
        cpf_participation = {
            "value_eur": participation_value,
            "value_label": format_eur(participation_value),
            "basis": f"Extrait de l'arrete annuel ({args.arrete_url}).",
            "raw_legal_text": participation_raw,
        }
    else:
        warnings.append("Montant de participation non extrait automatiquement depuis l'arrete.")

    needs_review = bool(warnings)
    if source_changed(previous_sources.get("arrete_revalorisation", {}), arrete):
        needs_review = True
    if source_changed(previous_sources.get("code_travail_cpf", {}), code):
        needs_review = True

    payload = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "needs_review": needs_review,
        "warnings": warnings,
        "cpf_participation": cpf_participation,
        "cpf_cap": existing.get(
            "cpf_cap",
            {
                "value_label": "1 600 €",
                "value_eur": 1600,
                "basis": "Valeur editoriale Traguardo (veille reglementaire requise).",
            },
        ),
        "sources": [
            {k: v for k, v in arrete.items() if k != "text"},
            {k: v for k, v in code.items() if k != "text"},
        ],
    }

    if args.dry_run:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[ok] JSON mis a jour: {output_path}")
    if warnings:
        print("[warn] " + " | ".join(warnings))
    if needs_review:
        print("[info] needs_review=true (changement detecte ou extraction partielle).")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except urllib.error.URLError as exc:
        print(f"[error] Echec reseau: {exc}", file=sys.stderr)
        raise SystemExit(2)
