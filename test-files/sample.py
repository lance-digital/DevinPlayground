def calculate_tokens(text):
    """
    This is a sample Python file to test token counting functionality.
    The extension should display the token count for this file.
    """
    words = text.split()
    token_count = 0
    
    for word in words:
        if len(word) > 0:
            token_count += 1
    
    return token_count

sample_text = "Hello world, this is a test file for the VSCode token counter extension."
print(f"Token count: {calculate_tokens(sample_text)}")

class TokenCounter:
    def __init__(self):
        self.count = 0
    
    def add_tokens(self, amount):
        self.count += amount
    
    def get_count(self):
        return self.count
