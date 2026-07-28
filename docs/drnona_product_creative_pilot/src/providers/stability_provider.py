from .base import ImageGenerationProvider


class StabilityProvider(ImageGenerationProvider):
    name = "stability"

    def validate_configuration(self) -> tuple[bool, str]:
        return False, "Stability adapter is architectural only."

    def generate_background(self, prompt, negative_prompt, size, quality):
        raise NotImplementedError("Stability adapter is not configured.")
