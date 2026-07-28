from .base import ImageGenerationProvider


class PhotoRoomProvider(ImageGenerationProvider):
    name = "photoroom"

    def validate_configuration(self) -> tuple[bool, str]:
        return False, "PhotoRoom adapter is architectural only; configure and implement API contract."

    def generate_background(self, prompt, negative_prompt, size, quality):
        raise NotImplementedError("PhotoRoom background generation adapter is not configured.")
