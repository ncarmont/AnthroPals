from anthropic_interface import AnthropicInterface


url = "https://www.meetup.com/ruby-in-london/events/295338466/"
anthropic_interface = AnthropicInterface()
print(anthropic_interface.generate_completion(url))
