import inspect

from anthropic import HUMAN_PROMPT, AI_PROMPT
import requests
from bs4 import BeautifulSoup

from event_template import EventSummary


def get_event_summary_source() -> str:
    source_code = inspect.getsource(EventSummary)
    return source_code

def get_website_content(url: str) -> str:
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    website_content = str(soup)
    return website_content

def generate_main_prompt_body(url: str) -> str:
    prompt = f"<event_website>\n{get_website_content(url)}\n</event_website>\n\n"
    prompt += "Please summarise the website content into a python object with the function format:\n"
    prompt += f"<python object def>{get_event_summary_source()}</python object def>\n"
    prompt += f"In your reply, include only the code to generate the `EventSummary` object"
    return prompt

def generate_prompt(url: str) -> str:
    return f"{HUMAN_PROMPT}{generate_main_prompt_body(url)}{AI_PROMPT}"