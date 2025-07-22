import io
import re
from openai import OpenAI
from fastapi import UploadFile

class LLM:
    def __init__(self, token: str):
        self.token = token
        self.client = OpenAI(api_key=token)

    async def transcribe(self, audio: UploadFile):
        content = await audio.read()
        file_like = io.BytesIO(content)
        file_like.name = 'recording.webm'
        transcription = self.client.audio.transcriptions.create(
            model="gpt-4o-transcribe",
            file=file_like
        )
        return transcription


    async def get_score(self, transcription: str, question: str, reference: str):
        prompt = f"""
        You are an experienced interview coach.
    
        Here is a mock interview question:
        Question: {question}
    
        Here is the correct/reference answer:
        {reference}
    
        Here is the candidate's answer:
        {transcription}
    
        Based **only on the reference answer** (its content, scope, and detail), please give a score from 0 to 5 and explain briefly why. Do not penalize the candidate for things not mentioned in the reference.
    
        Give a score from **0 to 5**, where:
        - 5 = Excellent alignment with the reference
        - 0 = No meaningful alignment
    
        Respond in this format:
        Score: <0-5>
        Explanation: <your very short evaluation>
        """
        response = self.client.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=[{"role": "user", "content": prompt}]
        )
        print(response)
        return parse_score_response(response.choices[0].message.content.strip())


# --- helper ---
def parse_score_response(content: str) -> dict:
    score_match = re.search(r"Score:\s*(\d+)", content)
    explanation_match = re.search(r"Explanation:\s*(.*)", content, re.DOTALL)
    return {
        "score": int(score_match.group(1)) if score_match else None,
        "explanation": explanation_match.group(1).strip() if explanation_match else None
    }
