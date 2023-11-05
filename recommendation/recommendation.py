
import pandas as pd
from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT

ANTHROPIC_API_KEY = "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"


def get_recommendations(df, subject, objective, winder_intrest):
    df_json = df.to_json(orient='records')

    prompt = f"Here is a list of events: {df_json}. Based on this list tell me the name of the 3 that " \
             f"are related to be subject of {subject} and would be best for {objective}. "\
            f"Suggest a forth event from the list of event which is related to {winder_intrest}"

    anthropic = Anthropic(api_key=ANTHROPIC_API_KEY)

    completion = anthropic.completions.create(
        model="claude-2",
        prompt=f"{HUMAN_PROMPT}{prompt}{AI_PROMPT}",
        max_tokens_to_sample=100)
    print(completion)
    return completion.completion

# def refine_list(ai_recommendations, objective):
#     prompt = f"This is a list of events {ai_recommendations} Tell me the name of the 3 events from this list would be best for " \
#              f{objective} "
#
#     anthropic = Anthropic(api_key=ANTHROPIC_API_KEY)
#
#     completion = anthropic.completions.create(
#         model="claude-2",
#         prompt=f"{HUMAN_PROMPT}{prompt}{AI_PROMPT}",
#         max_tokens_to_sample=100)
#     print(completion)
#     return completion.completion


# Example
def main():

    subject = "AI"
    objective = "making friends"
    winder_intrest ="music"
    path = r'C:\Users\Lina.Drozd\OneDrive - Baringa Partners LLP\Documents\events.csv'
    df = pd.read_csv(path)

    ai_recommendations = get_recommendations(df=df, subject=subject, objective=objective,winder_intrest=winder_intrest)

    # final_list = refine_list(ai_recommendations =ai_recommendations, objective=objective)

    print (ai_recommendations)

if __name__ == '__main__':
    main()