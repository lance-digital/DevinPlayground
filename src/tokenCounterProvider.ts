import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface TokenCache {
    [filePath: string]: {
        tokenCount: number;
        lastModified: number;
    };
}

export class TokenCounterProvider implements vscode.FileDecorationProvider {
    private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
    readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
    
    private cache: TokenCache = {};
    private encoder: any;
    
    constructor() {
        console.log('🔧 Initializing TokenCounterProvider...');
        this.encoder = null;
        console.log('✅ TokenCounterProvider initialized with JavaScript token estimation');
    }
    
    provideFileDecoration(uri: vscode.Uri): vscode.ProviderResult<vscode.FileDecoration> {
        try {
            console.log(`🎯 [DECORATION] Called for: ${uri.toString()}`);
            
            if (uri.scheme !== 'file') {
                console.log(`⚠️ [DECORATION] Skipping non-file URI: ${uri.toString()}`);
                return undefined;
            }
            
            console.log(`🎯 [DECORATION] Processing file: ${uri.fsPath}`);
            const tokenCount = this.getTokenCount(uri);
            console.log(`📊 [DECORATION] Token count for ${uri.fsPath}: ${tokenCount}`);
            
            if (tokenCount === 0) {
                console.log(`⚠️ [DECORATION] Zero tokens, returning undefined for: ${uri.fsPath}`);
                return undefined;
            }
            
            const decoration = {
                badge: this.formatTokenCount(tokenCount),
                tooltip: `${tokenCount.toLocaleString()} tokens`,
                color: new vscode.ThemeColor('descriptionForeground')
            };
            
            console.log(`✅ [DECORATION] Created decoration for ${uri.fsPath}: badge="${decoration.badge}", tooltip="${decoration.tooltip}"`);
            return decoration;
            
        } catch (error) {
            console.error(`❌ [DECORATION] Error providing decoration for ${uri.fsPath}:`, error);
            return undefined;
        }
    }
    
    private getTokenCount(uri: vscode.Uri): number {
        const filePath = uri.fsPath;
        
        try {
            console.log(`📊 [COUNT] Getting token count for: ${filePath}`);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                console.log(`📁 [COUNT] Processing as directory: ${filePath}`);
                const folderCount = this.getFolderTokenCount(filePath);
                console.log(`📁 [COUNT] Directory token count: ${folderCount}`);
                return folderCount;
            } else if (stat.isFile()) {
                console.log(`📄 [COUNT] Processing as file: ${filePath}`);
                const fileCount = this.getFileTokenCount(filePath, stat.mtimeMs);
                console.log(`📄 [COUNT] File token count: ${fileCount}`);
                return fileCount;
            }
        } catch (error) {
            console.error(`❌ [COUNT] Error getting token count for ${filePath}:`, error);
            return 0;
        }
        
        console.log(`⚠️ [COUNT] Unknown file type for: ${filePath}`);
        return 0;
    }
    
    private getFileTokenCount(filePath: string, lastModified: number): number {
        console.log(`📄 [FILE] Processing file: ${path.basename(filePath)}`);
        
        const cached = this.cache[filePath];
        if (cached && cached.lastModified === lastModified) {
            console.log(`💾 [FILE] Using cached result for ${path.basename(filePath)}: ${cached.tokenCount}`);
            return cached.tokenCount;
        }
        
        if (!this.shouldProcessFile(filePath)) {
            console.log(`🚫 [FILE] File excluded by filter: ${path.basename(filePath)}`);
            return 0;
        }
        
        try {
            const config = vscode.workspace.getConfiguration('tokenCounter');
            const maxFileSize = config.get<number>('maxFileSize', 1048576);
            
            const stat = fs.statSync(filePath);
            if (stat.size > maxFileSize) {
                console.log(`📏 [FILE] File too large (${stat.size} > ${maxFileSize}): ${path.basename(filePath)}`);
                return 0;
            }
            
            console.log(`📖 [FILE] Reading file content: ${path.basename(filePath)} (${stat.size} bytes)`);
            const content = fs.readFileSync(filePath, 'utf8');
            
            const tokenCount = this.estimateTokenCount(content);
            console.log(`📊 [FILE] Estimated ${tokenCount} tokens for ${path.basename(filePath)}`);
            
            this.cache[filePath] = {
                tokenCount,
                lastModified
            };
            
            return tokenCount;
        } catch (error) {
            console.error(`❌ [FILE] Error counting tokens for ${path.basename(filePath)}:`, error);
            return 0;
        }
    }
    
    private getFolderTokenCount(folderPath: string): number {
        let totalTokens = 0;
        
        try {
            console.log(`📁 [FOLDER] Processing folder: ${path.basename(folderPath)}`);
            const items = fs.readdirSync(folderPath);
            console.log(`📁 [FOLDER] Found ${items.length} items in ${path.basename(folderPath)}`);
            
            for (const item of items) {
                const itemPath = path.join(folderPath, item);
                
                try {
                    const stat = fs.statSync(itemPath);
                    
                    if (stat.isDirectory()) {
                        console.log(`📁 [FOLDER] Processing subdirectory: ${item}`);
                        const folderTokens = this.getFolderTokenCount(itemPath);
                        totalTokens += folderTokens;
                        console.log(`📁 [FOLDER] Subdirectory ${item}: ${folderTokens} tokens`);
                    } else if (stat.isFile()) {
                        console.log(`📄 [FOLDER] Processing file: ${item}`);
                        const fileTokens = this.getFileTokenCount(itemPath, stat.mtimeMs);
                        totalTokens += fileTokens;
                        if (fileTokens > 0) {
                            console.log(`📄 [FOLDER] File ${item}: ${fileTokens} tokens`);
                        }
                    }
                } catch (itemError) {
                    console.error(`❌ [FOLDER] Error processing item ${item}:`, itemError);
                }
            }
            
            console.log(`📁 [FOLDER] Total tokens for ${path.basename(folderPath)}: ${totalTokens}`);
        } catch (error) {
            console.error(`❌ [FOLDER] Error processing folder ${folderPath}:`, error);
        }
        
        return totalTokens;
    }
    
    private shouldProcessFile(filePath: string): boolean {
        const config = vscode.workspace.getConfiguration('tokenCounter');
        const excludedFileTypes = config.get<string[]>('excludedFileTypes', []);
        
        const ext = path.extname(filePath).toLowerCase();
        
        const shouldProcess = !excludedFileTypes.includes(ext);
        
        console.log(`🔍 [FILTER] File: ${path.basename(filePath)}`);
        console.log(`🔍 [FILTER] Extension: "${ext}" (empty: ${ext === ''})`);
        console.log(`🔍 [FILTER] Excluded types: [${excludedFileTypes.join(', ')}]`);
        console.log(`🔍 [FILTER] Should process: ${shouldProcess}`);
        
        return shouldProcess;
    }
    
    private formatTokenCount(count: number): string {
        if (count >= 1000000) {
            const millions = Math.floor(count / 1000000);
            if (millions >= 10) {
                return `${Math.min(millions, 99)}M`;
            } else {
                return `${millions}M`;
            }
        } else if (count >= 1000) {
            const thousands = Math.floor(count / 1000);
            if (thousands >= 10) {
                return `${Math.min(thousands, 99)}K`;
            } else {
                return `${thousands}K`;
            }
        } else if (count >= 100) {
            return `${Math.min(Math.floor(count / 100), 9)}H`;
        } else if (count >= 10) {
            return `${Math.floor(count / 10)}T`;
        } else if (count > 0) {
            return count.toString();
        } else {
            return "0";
        }
    }
    
    public refresh(): void {
        console.log('🔄 [REFRESH] Refreshing all decorations and clearing cache...');
        this.cache = {};
        this._onDidChangeFileDecorations.fire(undefined);
        
        setTimeout(() => {
            console.log('🔄 [REFRESH] Secondary refresh trigger...');
            this._onDidChangeFileDecorations.fire(undefined);
        }, 500);
        
        setTimeout(() => {
            console.log('🔄 [REFRESH] Tertiary refresh trigger...');
            this._onDidChangeFileDecorations.fire(undefined);
        }, 1500);
    }
    
    public onFileChanged(uri: vscode.Uri): void {
        console.log(`🔄 [CHANGE] File changed notification: ${uri.fsPath}`);
        delete this.cache[uri.fsPath];
        this._onDidChangeFileDecorations.fire(uri);
        
        setTimeout(() => {
            console.log(`🔄 [CHANGE] Delayed refresh for: ${uri.fsPath}`);
            this._onDidChangeFileDecorations.fire(uri);
        }, 100);
    }
    
    public onFileDeleted(uri: vscode.Uri): void {
        delete this.cache[uri.fsPath];
        this._onDidChangeFileDecorations.fire(uri);
    }
    
    private estimateTokenCount(content: string): number {
        
        const normalizedContent = content.replace(/\s+/g, ' ').trim();
        
        const charCount = normalizedContent.length;
        let tokenEstimate = Math.ceil(charCount / 4);
        
        const codePatterns = /[{}();,.\[\]]/g;
        const codeMatches = (normalizedContent.match(codePatterns) || []).length;
        
        if (codeMatches > charCount * 0.1) {
            tokenEstimate = Math.ceil(charCount / 3.5); // More tokens for code
        }
        
        return Math.max(tokenEstimate, normalizedContent.length > 0 ? 1 : 0);
    }
    
    public async preCalculateTokenCounts(files: vscode.Uri[]): Promise<void> {
        console.log(`🔄 Pre-calculating token counts for ${files.length} files...`);
        
        for (const file of files) {
            try {
                const stat = await vscode.workspace.fs.stat(file);
                if (stat.type === vscode.FileType.File) {
                    this.getFileTokenCount(file.fsPath, stat.mtime);
                }
            } catch (error) {
                console.error(`Error pre-calculating tokens for ${file.fsPath}:`, error);
            }
        }
        
        console.log('✅ Pre-calculation completed');
    }
    
    public async getGitignorePatterns(workspaceFolder: vscode.Uri): Promise<string[]> {
        try {
            const gitignorePath = vscode.Uri.joinPath(workspaceFolder, '.gitignore');
            const gitignoreContent = await vscode.workspace.fs.readFile(gitignorePath);
            const content = Buffer.from(gitignoreContent).toString('utf8');
            
            return content
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'))
                .map(pattern => {
                    if (pattern.endsWith('/')) {
                        return `**/${pattern}**`;
                    }
                    return `**/${pattern}`;
                });
        } catch (error) {
            console.log(`No .gitignore found in ${workspaceFolder.fsPath}`);
            return [];
        }
    }
}
