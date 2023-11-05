import json

from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT
from dotenv import load_dotenv

from prompt_generator import generate_main_prompt_body, generate_prompt_for_retry
from event_template import MaybeEventSummary
from requests.exceptions import SSLError

load_dotenv()

PRE_FILL = '{'

def generate_prompt(url: str) -> str:
    return f"{HUMAN_PROMPT}{generate_main_prompt_body(url)}{AI_PROMPT}{PRE_FILL}"

class AnthropicInterface(Anthropic):
    def __init__(self, max_tokens_to_sample: int = 1000, model: str = "claude-instant-1"):
        self.model = model
        self.max_tokens_to_sample = max_tokens_to_sample
        self.temperature = 0  # For reproducibility
        super().__init__()

    def generate_completion(self, prompt: str) -> str:
        return self.completions.create(
            model=self.model,
            max_tokens_to_sample=self.max_tokens_to_sample,
            temperature=self.temperature,
            prompt=prompt,
        ).completion
    
    def try_create_event_summary(self, url: str, max_attempts: int = 3) -> MaybeEventSummary:
        def create_event_summary(completion_output: str) -> MaybeEventSummary | str:
            try:
                completion_dict = json.loads(completion_output)
                event_summary = MaybeEventSummary(**completion_dict)
                return event_summary
            except Exception as e:
                print('Got SSL error, skipping...')
                return generate_prompt_for_retry(e)
            return None
        try:
            current_prompt = generate_prompt(url) 
        except SSLError:
            return MaybeEventSummary(is_single_event_page_and_is_in_future=False, event_summary=None)
        for _ in range(max_attempts):
            completion_output_no_prefill = self.generate_completion(current_prompt)
            completion_output_full = PRE_FILL + completion_output_no_prefill
            event_summary = create_event_summary(completion_output_full)
            if isinstance(event_summary, MaybeEventSummary):
                return event_summary
            else:
                print(completion_output_full)
                print(event_summary)
                current_prompt = f'{current_prompt}{completion_output_no_prefill}{HUMAN_PROMPT}{event_summary}{AI_PROMPT}{PRE_FILL}'
        return MaybeEventSummary(is_single_event_page_and_is_in_future=False, event_summary=None)
