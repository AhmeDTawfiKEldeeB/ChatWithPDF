import os

from dotenv import load_dotenv
from openai import OpenAI


def test_openrouter(model: str = "openai/gpt-4o-mini") -> None:
	load_dotenv()

	api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
	if not api_key:
		raise RuntimeError(
			"Missing API key. Set OPENROUTER_API_KEY in your environment or .env file."
		)

	base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
	client = OpenAI(api_key=api_key, base_url=base_url)

	headers = {}
	http_referer = os.getenv("OPENROUTER_HTTP_REFERER")
	app_title = os.getenv("OPENROUTER_APP_NAME")
	if http_referer:
		headers["HTTP-Referer"] = http_referer
	if app_title:
		headers["X-Title"] = app_title

	completion = client.chat.completions.create(
		model=model,
		messages=[
			{"role": "system", "content": "You are a helpful assistant."},
			{"role": "user", "content": "Reply with: OpenRouter test successful."},
		],
		temperature=0,
		max_tokens=60,
		extra_headers=headers if headers else None,
	)

	print("Model:", completion.model)
	print("Response:", completion.choices[0].message.content)


if __name__ == "__main__":
	test_openrouter(model=os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini"))

