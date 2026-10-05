"""Lead scoring system.

Scores are 0–100 and fully interpretable — each component is independently
capped and documented below. No black-box ML.

Score breakdown (max 100):
  reviews   0–30  — volume of social proof
  rating    0–25  — quality of social proof
  website   0–30  — digital presence (has_website, domain_valid, web signals)
  phone     0–15  — reachability

Segments (canonical keys stored in CSV before localization):
  micro   0–24
  small  25–49
  medium 50–74
  large  75–100
"""
import logging
import pandas as pd

logger = logging.getLogger(__name__)

SEGMENT_LABELS = {
    "pt": {
        "micro": "Micro",
        "small": "Pequena",
        "medium": "Média",
        "large": "Grande",
    },
    "en": {
        "micro": "Micro",
        "small": "Small",
        "medium": "Medium",
        "large": "Large",
    },
}

# Reverse lookup: any known label -> canonical key
_REVERSE: dict[str, str] = {}
for _lang, labels in SEGMENT_LABELS.items():
    for key, label in labels.items():
        _REVERSE[label.lower()] = key
        _REVERSE[key.lower()] = key


def normalize_segment_key(value) -> str:
    """Map any segment label (pt/en/canonical) back to canonical key."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    text = str(value).strip().lower()
    return _REVERSE.get(text, text)


def localize_segment(value, lang: str = "pt") -> str:
    """Return display label for a segment in the requested language."""
    key = normalize_segment_key(value)
    if not key:
        return ""
    table = SEGMENT_LABELS.get(lang[:2].lower(), SEGMENT_LABELS["pt"])
    return table.get(key, key)


def localize_segment_column(df: pd.DataFrame, lang: str = "pt") -> pd.DataFrame:
    """Replace 'segment' column values with localized display labels."""
    if "segment" not in df.columns:
        return df
    df = df.copy()
    df["segment"] = df["segment"].apply(lambda v: localize_segment(v, lang))
    return df


def _score_reviews(val) -> float:
    try:
        n = int(val)
    except (ValueError, TypeError):
        return 0.0
    if n >= 500:
        return 30.0
    if n >= 200:
        return 24.0
    if n >= 100:
        return 18.0
    if n >= 50:
        return 12.0
    if n >= 10:
        return 7.0
    if n >= 1:
        return 3.0
    return 0.0


def _score_rating(val) -> float:
    try:
        s = float(val)
    except (ValueError, TypeError):
        return 0.0
    if s >= 4.5:
        return 25.0
    if s >= 4.0:
        return 20.0
    if s >= 3.5:
        return 15.0
    if s >= 3.0:
        return 10.0
    if s > 0:
        return 5.0
    return 0.0


def _score_website(row) -> float:
    pts = 0.0
    if row.get('has_website'):
        pts += 10.0
    if row.get('domain_valid'):
        pts += 5.0
    if row.get('web_has_contact'):
        pts += 5.0
    if row.get('web_has_services'):
        pts += 5.0
    if row.get('web_is_modern'):
        pts += 5.0
    return pts


def _score_phone(row) -> float:
    return 15.0 if row.get('has_phone') else 0.0


def _segment(score: float) -> str:
    if score < 25:
        return 'micro'
    if score < 50:
        return 'small'
    if score < 75:
        return 'medium'
    return 'large'


def compute_scores(df: pd.DataFrame) -> pd.DataFrame:
    """Add 'score' (0–100, float) and 'segment' columns to the DataFrame."""
    df = df.copy()

    review_pts = df['reviews'].apply(_score_reviews)
    rating_pts = df['stars'].apply(_score_rating)
    website_pts = df.apply(_score_website, axis=1)
    phone_pts = df.apply(_score_phone, axis=1)

    raw = review_pts + rating_pts + website_pts + phone_pts
    df['score'] = raw.clip(0, 100).round(1)
    df['segment'] = df['score'].apply(_segment)

    logger.info(
        "Scoring complete — segment distribution: %s",
        df['segment'].value_counts().to_dict(),
    )
    return df
