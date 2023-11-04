from anthropic import Anthropic
from prompt_generator import generate_prompt
from dotenv import load_dotenv


load_dotenv()

class AnthropicInterface(Anthropic):
    def __init__(self, max_tokens_to_sample: int = 1000, model: str ="claude-2"):
        self.model = model
        self.max_tokens_to_sample = max_tokens_to_sample
        super().__init__()

    def generate_completion(self, url: str) -> str:
        return self.completions.create(
            model=self.model,
            max_tokens_to_sample=self.max_tokens_to_sample,
            prompt=generate_prompt(url),
        ).completion