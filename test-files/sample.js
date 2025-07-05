function calculateTokens(text) {
    const words = text.split(' ');
    let tokenCount = 0;
    
    for (const word of words) {
        if (word.length > 0) {
            tokenCount++;
        }
    }
    
    return tokenCount;
}

const sampleText = "Hello world, this is a test file for the VSCode token counter extension.";
console.log(`Token count: ${calculateTokens(sampleText)}`);
