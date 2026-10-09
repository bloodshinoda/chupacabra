from __future__ import annotations

import json
from pathlib import Path
import tempfile
import unittest

from engine.orchestration.profiles import (
    PROFILE_LIMITS,
    ProfileSettingsStore,
    get_profile,
    profile_defaults,
    resolve_profile,
    validate_profile_settings,
)


class ProfileSettingsTests(unittest.TestCase):
    def test_presets_preservam_os_tres_identificadores_e_valores(self) -> None:
        self.assertEqual(
            [get_profile(name).name for name in ("rapido", "balanceado", "chupacabra")],
            ["rapido", "balanceado", "chupacabra"],
        )
        self.assertEqual(get_profile("rapido").settings(), {
            "limit": 250,
            "scraper_concurrency": 5,
            "scrape_websites": False,
            "web_concurrency": 4,
            "web_batch_size": 100,
            "web_timeout": 6,
            "delay_min": 3,
            "delay_max": 7,
        })
        self.assertEqual(get_profile("balanceado").limit, 500)
        self.assertEqual(get_profile("chupacabra").limit, 1000)
        self.assertTrue(get_profile("balanceado").scrape_websites)
        self.assertTrue(get_profile("chupacabra").scrape_websites)

    def test_valida_extremos_e_rejeita_valores_invalidos(self) -> None:
        defaults = get_profile("balanceado").settings()
        for key, (minimum, maximum) in PROFILE_LIMITS.items():
            min_case = {**defaults, key: minimum}
            max_case = {**defaults, key: maximum}
            if key == "delay_min":
                min_case["delay_max"] = minimum
                max_case["delay_max"] = maximum
            elif key == "delay_max":
                min_case["delay_min"] = minimum
                max_case["delay_min"] = min(defaults["delay_min"], maximum)
            validate_profile_settings("balanceado", min_case)
            validate_profile_settings("balanceado", max_case)
            for invalid in (minimum - 1, maximum + 1, -1):
                with self.subTest(field=key, invalid=invalid):
                    with self.assertRaises(ValueError):
                        validate_profile_settings("balanceado", {**defaults, key: invalid})

        for invalid in (0, -1, 5001):
            with self.subTest(limit=invalid):
                with self.assertRaises(ValueError):
                    validate_profile_settings("balanceado", {**defaults, "limit": invalid})
        with self.assertRaises(ValueError):
            validate_profile_settings("balanceado", {**defaults, "scraper_concurrency": True})
        with self.assertRaisesRegex(ValueError, "delay_max"):
            validate_profile_settings("balanceado", {**defaults, "delay_min": 40, "delay_max": 39})

    def test_persiste_um_perfil_e_preserva_os_demais_apos_reabrir(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "data" / "profile-settings.json"
            store = ProfileSettingsStore(path)
            before, warnings = store.load()
            self.assertFalse(warnings)
            self.assertEqual(before, {name: get_profile(name) for name in before})

            changed = get_profile("rapido").settings()
            changed["limit"] = 321
            store.save("rapido", changed)

            reopened, warnings = ProfileSettingsStore(path).load()
            self.assertFalse(warnings)
            self.assertEqual(reopened["rapido"].limit, 321)
            self.assertEqual(reopened["balanceado"], get_profile("balanceado"))
            self.assertEqual(reopened["chupacabra"], get_profile("chupacabra"))

            changed_again = reopened["balanceado"].settings()
            changed_again["web_timeout"] = 13
            ProfileSettingsStore(path).save("balanceado", changed_again)
            reopened_again, _ = ProfileSettingsStore(path).load()
            self.assertEqual(reopened_again["rapido"].limit, 321)
            self.assertEqual(reopened_again["balanceado"].web_timeout, 13)
            self.assertEqual(reopened_again["chupacabra"], get_profile("chupacabra"))

    def test_arquivo_incompleto_usa_padrao_apenas_no_campo_ausente_ou_invalido(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "profile-settings.json"
            path.write_text(json.dumps({
                "version": 1,
                "profiles": {
                    "rapido": {"limit": 333, "web_timeout": 999},
                    "balanceado": {"delay_min": 30, "delay_max": 45},
                },
            }), encoding="utf-8")

            configured, warnings = ProfileSettingsStore(path).load()
            self.assertEqual(configured["rapido"].limit, 333)
            self.assertEqual(configured["rapido"].web_timeout, get_profile("rapido").web_timeout)
            self.assertEqual(configured["balanceado"].delay_min, 30)
            self.assertEqual(configured["balanceado"].delay_max, 45)
            self.assertEqual(configured["chupacabra"], get_profile("chupacabra"))
            self.assertTrue(warnings)
            self.assertEqual(json.loads(path.read_text(encoding="utf-8"))["profiles"]["rapido"]["web_timeout"], 999)

    def test_configuracao_corrompida_nao_e_sobrescrita_ao_salvar(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "profile-settings.json"
            corrupted = "{broken"
            path.write_text(corrupted, encoding="utf-8")
            store = ProfileSettingsStore(path)
            with self.assertRaisesRegex(ValueError, "Não foi possível ler"):
                store.load()
            with self.assertRaisesRegex(ValueError, "inválido e preservado"):
                store.save("rapido", get_profile("rapido").settings())
            self.assertEqual(path.read_text(encoding="utf-8"), corrupted)

    def test_snapshot_de_execucao_nao_muda_com_a_configuracao_seguinte(self) -> None:
        original = get_profile("rapido").settings()
        custom = {**original, "limit": 300}
        run_profile = resolve_profile("rapido", custom)
        custom["limit"] = 400
        self.assertEqual(run_profile.limit, 300)

    def test_defaults_api_contem_perfis_independentes(self) -> None:
        defaults = profile_defaults()
        self.assertEqual(set(defaults), {"rapido", "balanceado", "chupacabra"})
        self.assertIsNot(defaults["rapido"], defaults["balanceado"])


if __name__ == "__main__":
    unittest.main()
