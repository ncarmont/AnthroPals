import requests

from requests.structures import CaseInsensitiveDict
from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT

ANTHROPIC_API_KEY \
    = "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"

BRAVE_HEADER = CaseInsensitiveDict()
BRAVE_HEADER["Accept"] = "application/json"
BRAVE_HEADER["Accept-Encoding"] = "gzip"
BRAVE_HEADER["X-Subscription-Token"] = "BSAt2nmuC57jmjrGEY9-JNAyAHTU6Z5"


def _parse_brave_response(brave_response):
    for result in brave_response['web']['results']:
        print(result['url'])


def find_events_by_prompt():
    """Given a prompt around user preferences, translate this to search queries"""
    pass


def generate_web_searches_by_prompt():
    """Given a prompt, generate google searches to find event website"""

    prompt = """
    You are an assistant. 
    Your job is to give me a list of 10 google queries for finding events in London. 
    Vary your search queries to maximize the number of unique websites that will come up
    Output your answer as a json format ("search queries")
    
    For example if you were searching dance events your JSON output might be  
    {'search queries' : ["local dance events in London", "hip hop events in London this week", ...]}
    
    Give me a list of queries on google to find AI hackathon events in london. 
    """

    anthropic = Anthropic(api_key=ANTHROPIC_API_KEY)
    completion = anthropic.completions.create(
        model="claude-2",
        max_tokens_to_sample=300,
        prompt=f"{HUMAN_PROMPT} {prompt}{AI_PROMPT}",
    )
    print(completion.completion)
    pass


def execute_web_search(search_query, provider="brave"):
    """Execute a search using a provider and parse results"""

    # params = {"q": "List of websites of dance in london"}
    params = {"q": {search_query}}
    headers = BRAVE_HEADER

    response = requests.get(f"https://api.search.brave.com/res/v1/web/search", headers=headers, params=params)
    return response.json()


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



def run_tool():
    generate_web_searches_by_prompt()

    for search_query in ["ai hackathons london", "london ai hackathon 2023"]:
        print(f"running search query for {search_query}")
        json = execute_web_search(search_query)
        print(_parse_brave_response(json))

if __name__ == "__main__":
    run_tool()

