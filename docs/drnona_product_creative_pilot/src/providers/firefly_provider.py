from .base import ImageGenerationProvider


class AdobeFireflyProvider(ImageGenerationProvider):
    name = "firefly"

    def validate_configuration(self) -> tuple[bool, str]:
        return False, "Adobe Firefly adapter is architectural only."

    def generate_background(self, prompt, negative_prompt, size, quality):
        raise NotImplementedError("Adobe Firefly adapter is not configured.")
