import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

interface Entry {
    uri: vscode.Uri;
    type: vscode.FileType;
    tokenCount?: number;
}

export class TokenCounterFileSystemProvider implements vscode.TreeDataProvider<Entry>, vscode.FileSystemProvider {
    private _onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    private _onDidChangeTreeData = new vscode.EventEmitter<Entry | Entry[] | undefined | null | void>();
    private cache: { [filePath: string]: { tokenCount: number; lastModified: number } } = {};
    private gitignorePatterns: string[] = [];

    readonly onDidChangeFile = this._onDidChangeFile.event;
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor() {
        console.log('🚀 [FILESYSTEM] TokenCounterFileSystemProvider created');
    }

    watch(uri: vscode.Uri, options: { recursive: boolean; excludes: string[] }): vscode.Disposable {
        const watcher = fs.watch(uri.fsPath, { recursive: options.recursive }, () => {
            this._onDidChangeFile.fire([{ type: vscode.FileChangeType.Changed, uri }]);
            this._onDidChangeTreeData.fire(undefined);
        });
        return { dispose: () => watcher.close() };
    }

    stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
        return new Promise((resolve, reject) => {
            fs.stat(uri.fsPath, (error, stat) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        type: stat.isFile() ? vscode.FileType.File : vscode.FileType.Directory,
                        ctime: stat.ctime.getTime(),
                        mtime: stat.mtime.getTime(),
                        size: stat.size
                    });
                }
            });
        });
    }

    readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
        return new Promise((resolve, reject) => {
            fs.readdir(uri.fsPath, (error, files) => {
                if (error) {
                    reject(error);
                } else {
                    const result: [string, vscode.FileType][] = [];
                    for (const file of files) {
                        try {
                            const stat = fs.statSync(path.join(uri.fsPath, file));
                            result.push([file, stat.isDirectory() ? vscode.FileType.Directory : vscode.FileType.File]);
                        } catch (err) {
                            console.warn(`⚠️ [FILESYSTEM] Could not stat file: ${file}`, err);
                        }
                    }
                    resolve(result);
                }
            });
        });
    }

    createDirectory(uri: vscode.Uri): void | Thenable<void> {
        return new Promise((resolve, reject) => {
            fs.mkdir(uri.fsPath, { recursive: true }, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

    readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
        return new Promise((resolve, reject) => {
            fs.readFile(uri.fsPath, (error, data) => {
                if (error) reject(error);
                else resolve(data);
            });
        });
    }

    writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean }): void | Thenable<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile(uri.fsPath, content, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

    delete(uri: vscode.Uri, options: { recursive: boolean }): void | Thenable<void> {
        return new Promise((resolve, reject) => {
            if (options.recursive) {
                fs.rmdir(uri.fsPath, { recursive: true }, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            } else {
                fs.unlink(uri.fsPath, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            }
        });
    }

    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean }): void | Thenable<void> {
        return new Promise((resolve, reject) => {
            fs.rename(oldUri.fsPath, newUri.fsPath, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }

    async getChildren(element?: Entry): Promise<Entry[]> {
        console.log(`📁 [FILESYSTEM] getChildren called for: ${element ? element.uri.fsPath : 'root'}`);
        
        if (element) {
            if (element.type === vscode.FileType.Directory) {
                const children = await this.readDirectory(element.uri);
                const entries: Entry[] = [];
                
                for (const [name, type] of children) {
                    const childUri = vscode.Uri.file(path.join(element.uri.fsPath, name));
                    
                    if (this.shouldExcludeFile(childUri)) {
                        continue;
                    }
                    
                    const tokenCount = await this.getTokenCount(childUri, type);
                    entries.push({ uri: childUri, type, tokenCount });
                }
                
                return entries.sort((a, b) => {
                    if (a.type !== b.type) {
                        return a.type === vscode.FileType.Directory ? -1 : 1;
                    }
                    return path.basename(a.uri.fsPath).localeCompare(path.basename(b.uri.fsPath));
                });
            }
            return [];
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            await this.loadGitignorePatterns(workspaceFolder.uri);
            
            const children = await this.readDirectory(workspaceFolder.uri);
            const entries: Entry[] = [];
            
            for (const [name, type] of children) {
                const childUri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, name));
                
                if (this.shouldExcludeFile(childUri)) {
                    continue;
                }
                
                const tokenCount = await this.getTokenCount(childUri, type);
                entries.push({ uri: childUri, type, tokenCount });
            }
            
            return entries.sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type === vscode.FileType.Directory ? -1 : 1;
                }
                return path.basename(a.uri.fsPath).localeCompare(path.basename(b.uri.fsPath));
            });
        }

        return [];
    }

    getTreeItem(element: Entry): vscode.TreeItem {
        const basename = path.basename(element.uri.fsPath);
        const tokenSuffix = vscode.workspace.getConfiguration('tokenCounter').get<string>('tokenSuffix', 'トークン');
        const tokenCountStr = element.tokenCount ? `[${this.formatTokenCount(element.tokenCount)}${tokenSuffix}]` : '';
        const displayName = element.tokenCount ? `${basename} ${tokenCountStr}` : basename;
        
        console.log(`🎯 [FILESYSTEM] Creating tree item: ${displayName} (${element.tokenCount} tokens)`);
        
        const treeItem = new vscode.TreeItem(
            displayName,
            element.type === vscode.FileType.Directory 
                ? vscode.TreeItemCollapsibleState.Collapsed 
                : vscode.TreeItemCollapsibleState.None
        );
        
        treeItem.resourceUri = element.uri;
        treeItem.tooltip = element.tokenCount ? `${element.tokenCount.toLocaleString()} ${tokenSuffix}` : undefined;
        
        if (element.type === vscode.FileType.File) {
            treeItem.command = {
                command: 'vscode.open',
                title: 'Open File',
                arguments: [element.uri]
            };
        }
        
        return treeItem;
    }

    private async getTokenCount(uri: vscode.Uri, type: vscode.FileType): Promise<number> {
        try {
            if (type === vscode.FileType.File) {
                return await this.calculateFileTokens(uri);
            } else if (type === vscode.FileType.Directory) {
                return await this.calculateFolderTokens(uri);
            }
        } catch (error) {
            console.error(`❌ [FILESYSTEM] Error calculating tokens for ${uri.fsPath}:`, error);
        }
        return 0;
    }

    private async calculateFileTokens(uri: vscode.Uri): Promise<number> {
        const filePath = uri.fsPath;
        
        try {
            const stat = await fs.promises.stat(filePath);
            const lastModified = stat.mtime.getTime();
            
            if (this.cache[filePath] && this.cache[filePath].lastModified === lastModified) {
                return this.cache[filePath].tokenCount;
            }
            
            if (!this.shouldProcessFile(filePath)) {
                return 0;
            }
            
            const maxFileSize = vscode.workspace.getConfiguration('tokenCounter').get<number>('maxFileSize', 1048576);
            if (stat.size > maxFileSize) {
                console.log(`⚠️ [FILESYSTEM] File too large: ${filePath} (${stat.size} bytes)`);
                return 0;
            }
            
            const content = await fs.promises.readFile(filePath, 'utf8');
            const tokenCount = this.estimateTokens(content);
            
            this.cache[filePath] = { tokenCount, lastModified };
            
            console.log(`📊 [FILESYSTEM] File tokens: ${path.basename(filePath)} = ${tokenCount}`);
            return tokenCount;
            
        } catch (error) {
            console.error(`❌ [FILESYSTEM] Error reading file ${filePath}:`, error);
            return 0;
        }
    }

    private async calculateFolderTokens(uri: vscode.Uri): Promise<number> {
        try {
            const children = await this.readDirectory(uri);
            let totalTokens = 0;
            
            for (const [name, type] of children) {
                const childUri = vscode.Uri.file(path.join(uri.fsPath, name));
                
                if (this.shouldExcludeFile(childUri)) {
                    continue;
                }
                
                const childTokens = await this.getTokenCount(childUri, type);
                totalTokens += childTokens;
            }
            
            console.log(`📁 [FILESYSTEM] Folder tokens: ${path.basename(uri.fsPath)} = ${totalTokens}`);
            return totalTokens;
            
        } catch (error) {
            console.error(`❌ [FILESYSTEM] Error calculating folder tokens for ${uri.fsPath}:`, error);
            return 0;
        }
    }

    private shouldProcessFile(filePath: string): boolean {
        const ext = path.extname(filePath).toLowerCase();
        const excludedTypes = vscode.workspace.getConfiguration('tokenCounter').get<string[]>('excludedFileTypes', []);
        
        return !excludedTypes.includes(ext);
    }

    private shouldExcludeFile(uri: vscode.Uri): boolean {
        const filePath = uri.fsPath;
        const basename = path.basename(filePath);
        
        const defaultExcludes = ['node_modules', '.git', 'dist', 'build', '.DS_Store'];
        if (defaultExcludes.some(exclude => filePath.includes(exclude))) {
            return true;
        }
        
        if (basename.startsWith('.') && basename !== '.gitignore') {
            return true;
        }
        
        for (const pattern of this.gitignorePatterns) {
            if (this.matchesGitignorePattern(filePath, pattern)) {
                return true;
            }
        }
        
        return false;
    }

    private matchesGitignorePattern(filePath: string, pattern: string): boolean {
        if (pattern.endsWith('/')) {
            return filePath.includes(pattern.slice(0, -1));
        }
        
        if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(path.basename(filePath));
        }
        
        return filePath.includes(pattern) || path.basename(filePath) === pattern;
    }

    private async loadGitignorePatterns(workspaceUri: vscode.Uri): Promise<void> {
        try {
            const gitignorePath = path.join(workspaceUri.fsPath, '.gitignore');
            const content = await fs.promises.readFile(gitignorePath, 'utf8');
            
            this.gitignorePatterns = content
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'));
                
            console.log(`📋 [FILESYSTEM] Loaded ${this.gitignorePatterns.length} gitignore patterns`);
        } catch (error) {
            this.gitignorePatterns = [];
            console.log('📋 [FILESYSTEM] No .gitignore file found or error reading it');
        }
    }

    private estimateTokens(text: string): number {
        if (!text || text.trim().length === 0) {
            return 0;
        }
        
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const tokenEstimate = Math.ceil(words.length * 1.3);
        
        return tokenEstimate;
    }

    private formatTokenCount(count: number): string {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        } else {
            return count.toString();
        }
    }

    refresh(): void {
        console.log('🔄 [FILESYSTEM] Refreshing tree data');
        this.cache = {};
        this._onDidChangeTreeData.fire(undefined);
    }
}
