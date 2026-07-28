from .base import ImageGenerationProvider


class LocalFluxProvider(ImageGenerationProvider):
    name = "local-flux"

    def validate_configuration(self) -> tuple[bool, str]:
        return False, "Local FLUX adapter is architectural only; no model is bundled."

    def generate_background(self, prompt, negative_prompt, size, quality):
        raise NotImplementedError(
            "Configure a licensed local FLUX checkpoint and runtime before use."
        )
