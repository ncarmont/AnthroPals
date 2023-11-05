import os
import pickle
import datetime as dt

from anthropic_interface import AnthropicInterface, MaybeEventSummary

from event_template import EventSummary

CACHE_FILE = "cached_events.pkl"
URLS_FILE = "cached_urls.pkl"

def load_cached_events() -> dict[str, MaybeEventSummary]:
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "rb") as f:
            return pickle.load(f)
    else:
        return {}

def save_cached_events(cached_events: dict[str, MaybeEventSummary]):
    with open(CACHE_FILE, "wb") as f:
        pickle.dump(cached_events, f, protocol=pickle.HIGHEST_PROTOCOL)

def load_cached_urls() -> set[str]:
    if os.path.exists(URLS_FILE):
        with open(URLS_FILE, "rb") as f:
            return pickle.load(f)
    else:
        return set()

def save_cached_urls(cached_urls: set[str]):
    with open(URLS_FILE, "wb") as f:
        pickle.dump(cached_urls, f, protocol=pickle.HIGHEST_PROTOCOL)

def add_to_cached_urls(urls_to_add: set[str]):
    current_urls = load_cached_urls()
    current_urls = current_urls.union(urls_to_add)
    save_cached_urls(current_urls)

def fetch_event_summary(url: str) -> MaybeEventSummary:
    cached_events = load_cached_events()
    if url in cached_events:
        return cached_events[url]
    else:
        # event_summary = AnthropicInterface(model='claude-2').try_create_event_summary(url)
        event_summary = AnthropicInterface().try_create_event_summary(url)
        cached_events[url] = event_summary
        save_cached_events(cached_events)
        return event_summary
    
def get_all_future_events(current_datetime: dt.datetime) -> list[tuple[str, EventSummary]]:
    # (Warning, this will only return events that have been cached)
    cached_events = load_cached_events()
    future_events = []
    for url, maybe_event_summary in cached_events.items():
        if maybe_event_summary.event_summary is not None:
            event_summary = maybe_event_summary.event_summary
            # TODO: Handle timezones in a better way
            # (Ideally localize `current_datetime` and add localization to EventSummary validator)
            time_start = maybe_event_summary.event_summary.time_start
            if time_start.tzinfo is not None:
                time_start = time_start.replace(tzinfo=None)
            if time_start > current_datetime:
                future_events.append((url, event_summary))
    return future_events

if __name__ == "__main__":
    cached_urls = load_cached_urls()
    for url in cached_urls:
        print(url)
        fetch_event_summary(url)