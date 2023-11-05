from anthropic_interface import AnthropicInterface


test_urls = [
    "https://www.meetup.com/ruby-in-london/events/295338466/",
    "https://www.tickettailor.com/events/datafest/1033543",
    "https://www.eventbrite.co.uk/e/ai-fringe-day-1-expanding-the-conversation-ai-for-everyone-tickets-733357681567",
    "https://lu.ma/responsible-AI-charities",
    "https://docs.anthropic.com/claude/reference/client-sdks",
    "https://chat.openai.com/",
    "https://www.bbc.co.uk/news/world-us-canada-67319475",
]

if __name__ == "__main__":
    # anthropic_interface = AnthropicInterface(model='claude-2')
    anthropic_interface = AnthropicInterface()
    for url in test_urls:
        print(f"Trying to create event summary for {url}")
        print(anthropic_interface.try_create_event_summary(url))
        print()
