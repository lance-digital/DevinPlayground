import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';

interface Entry {
    uri: vscode.Uri;
    type: vscode.FileType;
    tokenCount?: number;
    size?: number;
    mtime?: number;
}

export class TokenCounterFileSystemProvider implements vscode.TreeDataProvider<Entry>, vscode.FileSystemProvider, vscode.TreeDragAndDropController<Entry> {
    private _onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    private _onDidChangeTreeData = new vscode.EventEmitter<Entry | Entry[] | undefined | null | void>();
    
    readonly dragMimeTypes = ['application/vnd.code.tree.tokenCounterExplorer'];
    readonly dropMimeTypes = ['application/vnd.code.tree.tokenCounterExplorer'];
    private cache: { [filePath: string]: { tokenCount: number; lastModified: number } } = {};
    private gitignorePatterns: string[] = [];
    private sortMode: 'name' | 'size' | 'date' | 'tokens' = 'name';
    private sortDirection: 'asc' | 'desc' = 'asc';
    private filter: string = '';
    private searchTerm: string = '';
    private searchActive: boolean = false;
    private expandedFolders: Set<string> = new Set();
    private selectedItems: Set<string> = new Set();
    private lastSelectedItem: string | null = null;

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
                const stat = await this.stat(childUri);
                entries.push({ 
                    uri: childUri, 
                    type, 
                    tokenCount,
                    size: stat.size,
                    mtime: stat.mtime
                });
            }
            
            return this.sortAndFilterEntries(entries);
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
        
        const isSelected = this.isSelected(element.uri.fsPath);
        treeItem.contextValue = element.type === vscode.FileType.Directory ? 'folder' : 'file';
        if (isSelected) {
            treeItem.contextValue += '_selected';
        }
        
        let tooltip = '';
        if (element.tokenCount) {
            tooltip += `${element.tokenCount.toLocaleString()} ${tokenSuffix}`;
        }
        if (element.size !== undefined) {
            tooltip += tooltip ? '\n' : '';
            tooltip += `Size: ${this.formatFileSize(element.size)}`;
        }
        if (element.mtime) {
            tooltip += tooltip ? '\n' : '';
            tooltip += `Modified: ${new Date(element.mtime).toLocaleString()}`;
        }
        tooltip += tooltip ? '\n' : '';
        tooltip += `Path: ${element.uri.fsPath}`;
        if (isSelected) {
            tooltip += '\n[Selected]';
        }
        
        treeItem.tooltip = tooltip;
        
        if (element.type === vscode.FileType.File) {
            const ext = path.extname(element.uri.fsPath).toLowerCase();
            treeItem.iconPath = this.getFileIcon(ext);
            treeItem.command = {
                command: 'vscode.open',
                title: 'Open File',
                arguments: [element.uri]
            };
        } else {
            treeItem.iconPath = new vscode.ThemeIcon('folder');
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
            const tokenCount = await this.estimateTokens(content);
            
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

    private async estimateTokens(text: string): Promise<number> {
        if (!text || text.trim().length === 0) {
            return 0;
        }
        
        const config = vscode.workspace.getConfiguration('tokenCounter');
        const tokenizerType = config.get<string>('tokenizerType', 'openai');
        
        try {
            switch (tokenizerType) {
                case 'openai':
                    return await this.estimateTokensOpenAI(text, config);
                case 'anthropic':
                    return await this.estimateTokensAnthropic(text, config);
                case 'google':
                    return await this.estimateTokensGoogle(text, config);
                default:
                    return this.estimateTokensFallback(text);
            }
        } catch (error) {
            console.warn(`Tokenizer ${tokenizerType} failed, falling back:`, error);
            return this.estimateTokensFallback(text);
        }
    }

    private async estimateTokensOpenAI(text: string, config: vscode.WorkspaceConfiguration): Promise<number> {
        try {
            const { encoding_for_model } = require('tiktoken');
            const model = config.get<string>('openaiModel', 'gpt-3.5-turbo');
            
            const encoding = encoding_for_model(model);
            const tokens = encoding.encode(text);
            encoding.free();
            return tokens.length;
        } catch (error) {
            console.warn('OpenAI tiktoken failed:', error);
            throw error;
        }
    }

    private async estimateTokensAnthropic(text: string, config: vscode.WorkspaceConfiguration): Promise<number> {
        try {
            const { countTokens } = require('@anthropic-ai/tokenizer');
            
            return await countTokens(text);
        } catch (error) {
            console.warn('Anthropic tokenizer failed:', error);
            throw error;
        }
    }

    private async estimateTokensGoogle(text: string, config: vscode.WorkspaceConfiguration): Promise<number> {
        try {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            
            const genAI = new GoogleGenerativeAI('dummy-key');
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
            
            const result = await model.countTokens(text);
            return result.totalTokens;
        } catch (error) {
            console.warn('Google AI tokenizer failed:', error);
            throw error;
        }
    }

    private estimateTokensFallback(text: string): number {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const characters = text.length;
        
        const charBasedEstimate = Math.ceil(characters / 4);
        const wordBasedEstimate = Math.ceil(words.length * 1.3);
        
        return Math.max(charBasedEstimate, wordBasedEstimate);
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

    async handleDrag(source: Entry[], treeDataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        const dragData = source.map(entry => ({
            uri: entry.uri.toString(),
            type: entry.type
        }));
        treeDataTransfer.set('application/vnd.code.tree.tokenCounterExplorer', new vscode.DataTransferItem(dragData));
    }

    async handleDrop(target: Entry | undefined, sources: vscode.DataTransfer, token: vscode.CancellationToken): Promise<void> {
        const transferItem = sources.get('application/vnd.code.tree.tokenCounterExplorer');
        if (!transferItem) {
            return;
        }

        const dragData = transferItem.value;
        if (!Array.isArray(dragData)) {
            return;
        }

        const targetUri = target ? target.uri : vscode.workspace.workspaceFolders?.[0]?.uri;
        if (!targetUri) {
            return;
        }

        for (const item of dragData) {
            try {
                const sourceUri = vscode.Uri.parse(item.uri);
                const sourceName = path.basename(sourceUri.fsPath);
                const destinationUri = vscode.Uri.joinPath(targetUri, sourceName);
                
                await vscode.workspace.fs.rename(sourceUri, destinationUri, { overwrite: false });
                console.log(`✅ [DRAG_DROP] Moved ${sourceUri.fsPath} to ${destinationUri.fsPath}`);
            } catch (error) {
                console.error(`❌ [DRAG_DROP] Failed to move file:`, error);
                vscode.window.showErrorMessage(`Failed to move file: ${error}`);
            }
        }

        this.refresh();
    }

    private sortAndFilterEntries(entries: Entry[]): Entry[] {
        let filtered = entries;
        
        if (this.searchTerm && this.searchActive) {
            filtered = this.applySearchFilter(entries, this.searchTerm);
        } else if (this.filter) {
            const filterPattern = this.filter.toLowerCase().replace(/\*/g, '.*');
            const regex = new RegExp(filterPattern);
            filtered = entries.filter(entry => {
                const name = path.basename(entry.uri.fsPath).toLowerCase();
                return regex.test(name);
            });
        }
        
        const config = vscode.workspace.getConfiguration('tokenCounter');
        const showHidden = config.get<boolean>('showHiddenFiles', false);
        
        if (!showHidden) {
            filtered = filtered.filter(entry => {
                const name = path.basename(entry.uri.fsPath);
                return !name.startsWith('.');
            });
        }
        
        return filtered.sort((a, b) => {
            let comparison = 0;
            
            if (a.type === vscode.FileType.Directory && b.type !== vscode.FileType.Directory) {
                return -1;
            }
            if (a.type !== vscode.FileType.Directory && b.type === vscode.FileType.Directory) {
                return 1;
            }
            
            switch (this.sortMode) {
                case 'name':
                    comparison = path.basename(a.uri.fsPath).localeCompare(path.basename(b.uri.fsPath));
                    break;
                case 'size':
                    comparison = (a.size || 0) - (b.size || 0);
                    break;
                case 'date':
                    comparison = (a.mtime || 0) - (b.mtime || 0);
                    break;
                case 'tokens':
                    comparison = (a.tokenCount || 0) - (b.tokenCount || 0);
                    break;
            }
            
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });
    }

    setSortMode(mode: 'name' | 'size' | 'date' | 'tokens') {
        this.sortMode = mode;
        const config = vscode.workspace.getConfiguration('tokenCounter');
        config.update('sortBy', mode, vscode.ConfigurationTarget.Workspace);
        this.refresh();
    }

    toggleSortDirection() {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        const config = vscode.workspace.getConfiguration('tokenCounter');
        config.update('sortDirection', this.sortDirection, vscode.ConfigurationTarget.Workspace);
        this.refresh();
    }

    setFilter(filter: string) {
        this.filter = filter;
        this.refresh();
    }

    collapseAll() {
        this.expandedFolders.clear();
        this.refresh();
    }

    expandAll() {
        const expandRecursively = async (uri: vscode.Uri) => {
            try {
                const entries = await this.readDirectory(uri);
                for (const [name, type] of entries) {
                    if (type === vscode.FileType.Directory) {
                        const childUri = vscode.Uri.joinPath(uri, name);
                        this.expandedFolders.add(childUri.fsPath);
                        await expandRecursively(childUri);
                    }
                }
            } catch (error) {
                console.error('Error expanding folder:', error);
            }
        };

        if (vscode.workspace.workspaceFolders) {
            expandRecursively(vscode.workspace.workspaceFolders[0].uri);
        }
        this.refresh();
    }

    private formatFileSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    selectItem(uri: string) {
        this.selectedItems.add(uri);
        this.lastSelectedItem = uri;
    }

    selectRange(fromUri: string, toUri: string) {
        this.selectedItems.add(fromUri);
        this.selectedItems.add(toUri);
    }

    toggleSelection(uri: string) {
        if (this.selectedItems.has(uri)) {
            this.selectedItems.delete(uri);
        } else {
            this.selectedItems.add(uri);
        }
        this.lastSelectedItem = uri;
    }

    clearSelection() {
        this.selectedItems.clear();
        this.lastSelectedItem = null;
    }

    getSelectedItems(): string[] {
        return Array.from(this.selectedItems);
    }

    isSelected(uri: string): boolean {
        return this.selectedItems.has(uri);
    }

    public formatFileSizePublic(bytes: number): string {
        return this.formatFileSize(bytes);
    }

    public async getTokenCountPublic(uri: vscode.Uri, type: vscode.FileType): Promise<number> {
        return await this.getTokenCount(uri, type);
    }

    private getFileIcon(extension: string): vscode.ThemeIcon {
        const iconMap: { [key: string]: string } = {
            '.js': 'symbol-method',
            '.ts': 'symbol-method',
            '.jsx': 'symbol-method',
            '.tsx': 'symbol-method',
            '.py': 'symbol-method',
            '.html': 'symbol-property',
            '.css': 'symbol-color',
            '.scss': 'symbol-color',
            '.less': 'symbol-color',
            '.json': 'symbol-property',
            '.md': 'markdown',
            '.txt': 'symbol-text',
            '.vue': 'symbol-method',
            '.svelte': 'symbol-method',
            '.php': 'symbol-method',
            '.rb': 'symbol-method',
            '.go': 'symbol-method',
            '.rs': 'symbol-method',
            '.java': 'symbol-method',
            '.c': 'symbol-method',
            '.cpp': 'symbol-method',
            '.h': 'symbol-method',
            '.hpp': 'symbol-method',
            '.xml': 'symbol-property',
            '.yaml': 'symbol-property',
            '.yml': 'symbol-property',
            '.toml': 'symbol-property',
            '.ini': 'symbol-property',
            '.cfg': 'symbol-property',
            '.conf': 'symbol-property',
            '.log': 'output',
            '.png': 'file-media',
            '.jpg': 'file-media',
            '.jpeg': 'file-media',
            '.gif': 'file-media',
            '.svg': 'file-media',
            '.pdf': 'file-pdf',
            '.zip': 'file-zip',
            '.tar': 'file-zip',
            '.gz': 'file-zip',
            '.rar': 'file-zip'
        };
        
        return new vscode.ThemeIcon(iconMap[extension] || 'file');
    }

    async selectMultiple(uris: string[], extend: boolean = false) {
        if (!extend) {
            this.clearSelection();
        }
        
        for (const uri of uris) {
            this.selectedItems.add(uri);
        }
        
        if (uris.length > 0) {
            this.lastSelectedItem = uris[uris.length - 1];
        }
        
        this._onDidChangeTreeData.fire(undefined);
    }

    async handleMultiSelect(uri: string, ctrlKey: boolean, shiftKey: boolean) {
        if (shiftKey && this.lastSelectedItem) {
            this.selectRange(this.lastSelectedItem, uri);
        } else if (ctrlKey) {
            this.toggleSelection(uri);
        } else {
            this.clearSelection();
            this.selectItem(uri);
        }
        
        this._onDidChangeTreeData.fire(undefined);
    }

    private applySearchFilter(entries: Entry[], searchTerm: string): Entry[] {
        if (!searchTerm || searchTerm.trim() === '') {
            return entries;
        }

        const trimmedTerm = searchTerm.trim();
        
        if (trimmedTerm.startsWith('/') && trimmedTerm.endsWith('/') && trimmedTerm.length > 2) {
            try {
                const regexPattern = trimmedTerm.slice(1, -1);
                const regex = new RegExp(regexPattern, 'i');
                return entries.filter(entry => {
                    const name = path.basename(entry.uri.fsPath);
                    return regex.test(name);
                });
            } catch (error) {
                console.warn('Invalid regex pattern:', error);
            }
        }
        
        if (trimmedTerm.startsWith('.')) {
            return entries.filter(entry => {
                const name = path.basename(entry.uri.fsPath);
                return name.toLowerCase().endsWith(trimmedTerm.toLowerCase());
            });
        }
        
        if (trimmedTerm.includes('*') || trimmedTerm.includes('?')) {
            const regexPattern = trimmedTerm
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*')
                .replace(/\?/g, '.');
            try {
                const regex = new RegExp(`^${regexPattern}$`, 'i');
                return entries.filter(entry => {
                    const name = path.basename(entry.uri.fsPath);
                    return regex.test(name);
                });
            } catch (error) {
                console.warn('Invalid wildcard pattern:', error);
            }
        }
        
        const lowerSearchTerm = trimmedTerm.toLowerCase();
        const results: { entry: Entry; score: number }[] = [];
        
        for (const entry of entries) {
            const name = path.basename(entry.uri.fsPath).toLowerCase();
            let score = 0;
            
            if (name === lowerSearchTerm) {
                score = 1000;
            }
            else if (name.startsWith(lowerSearchTerm)) {
                score = 800;
            }
            else if (name.includes(lowerSearchTerm)) {
                score = 600;
            }
            else {
                let searchIndex = 0;
                let lastMatchIndex = -1;
                let consecutiveMatches = 0;
                
                for (let i = 0; i < name.length && searchIndex < lowerSearchTerm.length; i++) {
                    if (name[i] === lowerSearchTerm[searchIndex]) {
                        if (i === lastMatchIndex + 1) {
                            consecutiveMatches++;
                        } else {
                            consecutiveMatches = 1;
                        }
                        score += consecutiveMatches * 10;
                        lastMatchIndex = i;
                        searchIndex++;
                    }
                }
                
                if (searchIndex < lowerSearchTerm.length) {
                    continue;
                }
                
                score += Math.max(0, 100 - name.length);
            }
            
            if (score > 0) {
                results.push({ entry, score });
            }
        }
        
        return results
            .sort((a, b) => b.score - a.score)
            .map(result => result.entry);
    }

    setSearchTerm(searchTerm: string) {
        this.searchTerm = searchTerm;
        this.searchActive = searchTerm.length > 0;
        vscode.commands.executeCommand('setContext', 'tokenCounter.hasActiveSearch', this.searchActive);
        this.refresh();
    }

    clearSearch() {
        this.searchTerm = '';
        this.searchActive = false;
        vscode.commands.executeCommand('setContext', 'tokenCounter.hasActiveSearch', false);
        this.refresh();
    }

    getSearchTerm(): string {
        return this.searchTerm;
    }
}
