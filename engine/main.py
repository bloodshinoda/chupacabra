"""CLI smoke-test entry point for the new engine layer."""
from __future__ import annotations

import argparse

from engine.orchestration.runner import ProspectingRunner
from engine.orchestration.targets import CATEGORIES, CITIES, build_queries


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Chupacabra prospecting engine")
    parser.add_argument("--profile", choices=("fast", "balanced", "aggressive"), default="fast")
    parser.add_argument("--query", help="Run one explicit Google Maps query")
    parser.add_argument("--city", action="append", help="City to include in matrix mode")
    parser.add_argument("--category", action="append", help="Category slug to include in matrix mode")
    parser.add_argument("--state", default="SC")
    parser.add_argument("--lang", default="pt")
    parser.add_argument("--country", default="br")
    parser.add_argument("--runs-dir", default="runs")
    return parser


def main() -> None:
    args = _parser().parse_args()

    if args.query:
        jobs = [("manual_001", args.city[0] if args.city else "custom", "custom", args.query)]
    else:
        cities = tuple(args.city) if args.city else CITIES
        if args.category:
            selected = {slug for slug in args.category}
            categories = tuple(item for item in CATEGORIES if item[0] in selected)
            if not categories:
                raise SystemExit("No known category matched --category")
        else:
            categories = CATEGORIES
        jobs = build_queries(cities=cities, categories=categories, state=args.state)

    runner = ProspectingRunner(
        store=__import__("engine.storage", fromlist=["RunStore"]).RunStore(args.runs_dir),
        event_handler=lambda event: print(event.to_dict()),
    )
    run = runner.run(jobs, profile=args.profile, lang=args.lang, country=args.country)
    print(f"Run {run.id}: {run.status.value} — {run.completed_jobs}/{run.total_jobs} completed")


if __name__ == "__main__":
    main()
