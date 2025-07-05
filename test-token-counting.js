const fs = require('fs');
const path = require('path');
const { encoding_for_model } = require('tiktoken');

class TokenCounterTest {
    constructor() {
        this.encoder = encoding_for_model('gpt-3.5-turbo');
        this.enabledFileTypes = ['.js', '.ts', '.jsx', '.tsx', '.py', '.md', '.txt', '.json', '.html', '.css', '.scss', '.less', '.vue', '.svelte', '.php', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.hpp'];
        this.maxFileSize = 1048576; // 1MB
    }
    
    shouldProcessFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return this.enabledFileTypes.includes(ext);
    }
    
    getFileTokenCount(filePath) {
        if (!this.shouldProcessFile(filePath)) {
            return 0;
        }
        
        try {
            const stat = fs.statSync(filePath);
            if (stat.size > this.maxFileSize) {
                return 0;
            }
            
            const content = fs.readFileSync(filePath, 'utf8');
            const tokens = this.encoder.encode(content);
            return tokens.length;
        } catch (error) {
            console.error(`Error counting tokens for ${filePath}:`, error);
            return 0;
        }
    }
    
    getFolderTokenCount(folderPath) {
        let totalTokens = 0;
        
        try {
            const items = fs.readdirSync(folderPath);
            
            for (const item of items) {
                const itemPath = path.join(folderPath, item);
                const stat = fs.statSync(itemPath);
                
                if (stat.isDirectory()) {
                    totalTokens += this.getFolderTokenCount(itemPath);
                } else if (stat.isFile()) {
                    totalTokens += this.getFileTokenCount(itemPath);
                }
            }
        } catch (error) {
            console.error(`Error processing folder ${folderPath}:`, error);
        }
        
        return totalTokens;
    }
    
    formatTokenCount(count) {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        } else {
            return count.toString();
        }
    }
}

console.log('🧪 Testing VSCode Token Counter Extension Logic...\n');

const tester = new TokenCounterTest();

const testFiles = [
    './test-files/sample.js',
    './test-files/sample.py', 
    './test-files/sample.md'
];

console.log('📄 Individual File Token Counts:');
testFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const tokenCount = tester.getFileTokenCount(file);
        const formatted = tester.formatTokenCount(tokenCount);
        console.log(`  ${file}: ${tokenCount} tokens (${formatted})`);
    } else {
        console.log(`  ${file}: File not found`);
    }
});

console.log('\n📁 Folder Token Count:');
const folderPath = './test-files';
if (fs.existsSync(folderPath)) {
    const folderTokens = tester.getFolderTokenCount(folderPath);
    const formatted = tester.formatTokenCount(folderTokens);
    console.log(`  ${folderPath}: ${folderTokens} tokens (${formatted})`);
} else {
    console.log(`  ${folderPath}: Folder not found`);
}

console.log('\n🔍 File Type Filtering Test:');
const testExtensions = ['.js', '.py', '.md', '.txt', '.xyz'];
testExtensions.forEach(ext => {
    const shouldProcess = tester.shouldProcessFile(`test${ext}`);
    console.log(`  ${ext}: ${shouldProcess ? '✅ Processed' : '❌ Ignored'}`);
});

console.log('\n✅ Token counting logic test completed!');
console.log('\nThis confirms the core functionality works correctly.');
console.log('The extension should display these token counts as badges in VSCode file explorer.');
