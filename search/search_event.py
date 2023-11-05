import json
import pandas as pd
import re
import requests

from requests.structures import CaseInsensitiveDict
from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT
from serpapi import GoogleSearch


ANTHROPIC_API_KEY \
    = "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"

SERP_API_KEY = "5b50cbf170851bd1d18fd0878bc0739ba82ffd23e364f1a23703ccb27910394b"

BRAVE_HEADER = CaseInsensitiveDict()
BRAVE_HEADER["Accept"] = "application/json"
BRAVE_HEADER["Accept-Encoding"] = "gzip"
BRAVE_HEADER["X-Subscription-Token"] = "BSAt2nmuC57jmjrGEY9-JNAyAHTU6Z5"


def _parse_brave_response(brave_response):
    return [{'title': result['title'], 'url': result['url']}
            for result in brave_response['web']['results']]


def _parse_serp_response(serp_response):
    organic_results = serp_response['organic_results']
    return {r['link'] for r in organic_results}


def _parse_claude_response(claude_response):
    # Regular expression to find JSON
    json_pattern = r'{.*?}'
    json_match = re.search(json_pattern, claude_response, re.DOTALL)

    # Check if a match was found
    if json_match:
        matched_json = json_match.group()
        return json.loads(matched_json)


def find_events_by_prompt():
    """Given a prompt around user preferences, translate this to search queries"""
    pass


def generate_web_searches_by_prompt(search_topic, retry=0):
    """Given an event descriptor (e.g science events), generate list google searches to find events"""

    instruction_prompt = """
        You are an assistant. 
        Your job is to give me a list of 10 google queries for finding events in London. 
        Vary your search queries to maximize the number of unique websites that will come up
        Output your answer as a json format.
        For example if you were searching dance events your JSON output might be  
        {'search_queries' : ["local dance events in London", "hip hop events in London this week", ...]}
        """
    event_prompt = f"\n Give me a list of google queries to find {search_topic} events in london."
    prompt = instruction_prompt + event_prompt

    if retry < 3:
        try:
            anthropic = Anthropic(api_key=ANTHROPIC_API_KEY)
            completion = anthropic.completions.create(
                model="claude-2",
                max_tokens_to_sample=300,
                prompt=f"{HUMAN_PROMPT}{prompt}{AI_PROMPT}",
            )
            completion = completion.completion
            completion = _parse_claude_response(completion)
            return completion['search_queries']

        except Exception as e:
            print(f"Retrying Claude (generate search results) (attempt: {retry})")
            generate_web_searches_by_prompt(search_topic=search_topic, retry=retry+1)

    raise ValueError("Claude cannot process search engine")


def execute_web_search(search_query, provider):
    """Execute a search using a provider and parse results"""

    if provider == "brave":
        params = {"q": {search_query}}
        headers = BRAVE_HEADER
        response = requests.get(f"https://api.search.brave.com/res/v1/web/search", headers=headers, params=params)
        return _parse_brave_response(response.json())

    if provider == "serp":

        params = {
            "q": {search_query},
            "location": "London, United Kingdom",
            "hl": "en",
            "gl": "us",
            "google_domain": "google.com",
            "api_key": SERP_API_KEY
        }

        search = GoogleSearch(params)
        results = search.get_dict()
        return _parse_serp_response(results)


def locate_event_link_on_website():
    """Given a website tree, locate the event link if it exists"""
    pass


def has_events_page():
    """Given a website, review links to find /events links"""
    pass


def run_events_locator():

    # generate google searches

    # execute google searches

    # aggregate search result links

    # visit each page & locate event page (if it exists)

    # send events page to team

    pass


def run_single_topic_flow(search_topic):
    print(f"Generating search queries for {search_topic}")
    search_queries = generate_web_searches_by_prompt(search_topic)

    for sq in search_queries:
        print(f"\t {sq}")

    # Generate links for each search query
    print(f"Generating links for each search query")

    events_by_topic = []
    for search_query in search_queries:
        try:
            search_query_links = execute_web_search(search_query=search_query, provider="brave")

            for brave_response in search_query_links:
                event_record = {'topic': search_topic,
                                'search_title': brave_response['title'],
                                'event_url': brave_response['url']}

                events_by_topic.append(event_record)

        except Exception as e:
            print("Encountered exception ... continuing")
            continue

    # store results
    df_events = pd.DataFrame(events_by_topic)
    events_csv_path = f"~/Desktop/{search_topic}_events.csv"
    df_events.to_csv(events_csv_path)
    print(f"Stored {search_topic} links to {events_csv_path}")

    return events_by_topic


def run_tool():

    # Specify search topic
    search_topics = ["dungeon and dragons", "auto show", "ai hackathon", "science lecture"]

    # Generate search queries for topic
    all_events = []

    for search_topic in search_topics:
        events_for_topic = run_single_topic_flow(search_topic)
        all_events.extend(events_for_topic)

    # Store all events
    df_events = pd.DataFrame(all_events)
    events_csv_path = f"~/Desktop/all_events.csv"
    df_events.to_csv(events_csv_path)
    print(f"Stored all event links to {events_csv_path}")





if __name__ == "__main__":
    run_tool()

