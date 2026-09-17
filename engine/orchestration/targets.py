"""Default prospecting matrix migrated from the legacy BAT launcher."""

CATEGORIES: tuple[tuple[str, str], ...] = (
    ("agencias_publicidade", "Agencias de publicidade"),
    ("graficas", "Graficas"),
    ("graficas_rapidas", "Grafica rapida"),
    ("comunicacao_visual", "Comunicacao visual"),
    ("marketing_digital", "Agencias de marketing digital"),
    ("brindes_corporativos", "Brindes corporativos"),
    ("eventos_corporativos", "Organizacao de eventos corporativos"),
    ("serigrafia_estamparia", "Serigrafia e estamparia"),
    ("imobiliarias", "Imobiliarias"),
    ("concessionarias", "Concessionarias de veiculos"),
    ("construtoras", "Construtoras"),
    ("clinicas_odontologicas", "Clinicas odontologicas"),
)

CITIES: tuple[str, ...] = (
    "Chapeco",
    "Xanxere",
    "Concordia",
)


# Additional targets present in the BAT as commented/ready entries. They are
# deliberately not enabled by default until the UI exposes target selection.
OPTIONAL_CATEGORIES: tuple[tuple[str, str], ...] = (
    ("escritorios_advocacia", "Escritorios de advocacia"),
    ("academias", "Academias"),
    ("supermercados", "Supermercados"),
    ("escolas_particulares", "Escolas particulares"),
    ("restaurantes", "Restaurantes"),
    ("distribuidoras", "Distribuidoras"),
)

OPTIONAL_CITIES: tuple[str, ...] = ("Xaxim", "Pinhalzinho")


def build_queries(
    cities: tuple[str, ...] = CITIES,
    categories: tuple[tuple[str, str], ...] = CATEGORIES,
    state: str = "SC",
) -> list[tuple[str, str, str, str]]:
    """Return (slug, city, category_slug, query) tuples."""
    jobs: list[tuple[str, str, str, str]] = []
    for city in cities:
        for slug, label in categories:
            query = f"{label} em {city} {state}"
            jobs.append((f"{slug}_{city.lower()}", city, slug, query))
    return jobs
