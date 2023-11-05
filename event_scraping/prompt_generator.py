import inspect

import requests
from bs4 import BeautifulSoup

from event_template import EventSummary, MaybeEventSummary


def get_event_summary_source() -> str:
    source_code = inspect.getsource(EventSummary)
    return source_code

def get_maybe_event_summary_source() -> str:
    source_code = inspect.getsource(MaybeEventSummary)
    return source_code

def get_website_content(url: str, size_limit: int = 20000) -> str:
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    website_content = str(soup)
    if len(website_content) > size_limit:
        website_content = website_content[:size_limit] + "..."
    return website_content

def generate_main_prompt_body(url: str) -> str:
    prompt = f"<event_website>\n{get_website_content(url)}\n</event_website>\n\n"
    prompt += "Please summarise the website content using the following JSON schema:\n"
    prompt += f"<JSON schema>{MaybeEventSummary.schema()}</JSON schema>\n"
    prompt += "In your reply, include only a response adhering to the schema.\n"
    prompt += "Note that `event_summary` must be `None` iff `is_event_and_is_in_future` is `False`."
    return prompt

def generate_prompt_for_retry(e: Exception) -> str:
    prompt = "Got the following error when trying to parse this into an event summary object adhering to the scheme:\n"
    prompt += f"<python runtime error>{e}</python runtime error>\n"
    prompt += "This is the code for the object we are trying to parse:\n"
    prompt += f"<python object def>{get_event_summary_source()}\n{get_maybe_event_summary_source()}</python object def>\n"
    prompt += "Can you please try again and, as before, try to only include only a response adhering to the schema in your reply."
    return prompt
