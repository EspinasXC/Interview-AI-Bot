from flask import Flask, request, jsonify
import openai

app = Flask(__name__)
openai.api_key = 'your-api-key'

history = []

def get_bot_response(user_input):
    global history

    if len(history) == 0:
        # Start the interview
        history.append({'sender': 'bot', 'message': "Welcome to the interview! Let's get started."})
        return "Welcome! Let's get started."

    # Store user input in history
    history.append({'sender': 'user', 'message': user_input})

    if len(history) % 2 == 0:
        # It's the bot's turn to respond with interview questions
        question = generate_interview_question()
        history.append({'sender': 'bot', 'message': question})
        return question
    else:
        # Evaluate user response
        evaluation = evaluate_response(user_input)
        history.append({'sender': 'bot', 'message': evaluation})
        return evaluation

def generate_interview_question():
    response = openai.Completion.create(
        engine="text-davinci-002",
        prompt="You are a professional interviewer. Generate an interview question.",
        max_tokens=50
    )
    return response.choices[0].text.strip()

def evaluate_response(response):
    response_evaluation = openai.Completion.create(
        engine="text-davinci-002",
        prompt="Evaluate the following interview response:" + response,
        max_tokens=100,
        temperature=0,
        stop=["\n"]
    )
    return response_evaluation.choices[0].text.strip()

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json['input']
    bot_response = get_bot_response(user_input)
    return jsonify({'output': bot_response})

@app.route('/history')
def chat_history():
    return jsonify(history)

if __name__ == '__main__':
    app.run(debug=True)
