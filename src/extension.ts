import * as vscode from 'vscode';
import * as path from 'path';
import { TokenCounterFileSystemProvider } from './fileSystemProvider';
// import { GitStatusProvider } from './gitStatusProvider';

export function activate(context: vscode.ExtensionContext) {
    try {
        console.log('🚀 [ACTIVATION] Token Counter extension activation started!');
        console.log('🚀 [ACTIVATION] VSCode version:', vscode.version);
        console.log('🚀 [ACTIVATION] Workspace folders:', vscode.workspace.workspaceFolders?.length || 0);
        
        const provider = new TokenCounterFileSystemProvider();
        console.log('✅ [ACTIVATION] TokenCounterFileSystemProvider created successfully');
        
        const treeView = vscode.window.createTreeView('tokenCounterExplorer', { 
            treeDataProvider: provider,
            showCollapseAll: true,
            dragAndDropController: provider,
            canSelectMany: true
        });
        context.subscriptions.push(treeView);
        console.log('✅ [ACTIVATION] TreeView registered');
        
        // const gitStatusProvider = new GitStatusProvider();
        // const gitDecorationProvider = vscode.window.registerFileDecorationProvider(gitStatusProvider);
        // context.subscriptions.push(gitDecorationProvider);
        // console.log('✅ [ACTIVATION] Git status decoration provider registered');
        
        const refreshCommand = vscode.commands.registerCommand('tokenCounter.refresh', async () => {
            console.log('🔄 [COMMAND] Manual refresh command triggered');
            try {
                provider.refresh();
                vscode.window.showInformationMessage('Token counts refreshed!');
            } catch (error) {
                console.error('❌ [COMMAND] Error during refresh:', error);
                vscode.window.showErrorMessage(`Refresh failed: ${error}`);
            }
        });
        context.subscriptions.push(refreshCommand);
        console.log('✅ [ACTIVATION] Refresh command registered');

        const newFileCommand = vscode.commands.registerCommand('tokenCounter.newFile', async (node: any) => {
            const fileName = await vscode.window.showInputBox({
                prompt: 'Enter file name',
                placeHolder: 'filename.txt'
            });
            if (fileName) {
                try {
                    const targetUri = node ? node.uri : vscode.workspace.workspaceFolders?.[0]?.uri;
                    if (targetUri) {
                        const newFileUri = vscode.Uri.joinPath(targetUri, fileName);
                        await vscode.workspace.fs.writeFile(newFileUri, new Uint8Array());
                        provider.refresh();
                        vscode.window.showInformationMessage(`File created: ${fileName}`);
                    }
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to create file: ${error}`);
                }
            }
        });
        context.subscriptions.push(newFileCommand);

        const newFolderCommand = vscode.commands.registerCommand('tokenCounter.newFolder', async (node: any) => {
            const folderName = await vscode.window.showInputBox({
                prompt: 'Enter folder name',
                placeHolder: 'new-folder'
            });
            if (folderName) {
                try {
                    const targetUri = node ? node.uri : vscode.workspace.workspaceFolders?.[0]?.uri;
                    if (targetUri) {
                        const newFolderUri = vscode.Uri.joinPath(targetUri, folderName);
                        await vscode.workspace.fs.createDirectory(newFolderUri);
                        provider.refresh();
                        vscode.window.showInformationMessage(`Folder created: ${folderName}`);
                    }
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to create folder: ${error}`);
                }
            }
        });
        context.subscriptions.push(newFolderCommand);

        const renameCommand = vscode.commands.registerCommand('tokenCounter.rename', async (node: any) => {
            if (!node) return;
            const currentName = path.basename(node.uri.fsPath);
            const newName = await vscode.window.showInputBox({
                prompt: 'Enter new name',
                value: currentName
            });
            if (newName && newName !== currentName) {
                try {
                    const parentUri = vscode.Uri.file(path.dirname(node.uri.fsPath));
                    const newUri = vscode.Uri.joinPath(parentUri, newName);
                    await vscode.workspace.fs.rename(node.uri, newUri, { overwrite: false });
                    provider.refresh();
                    vscode.window.showInformationMessage(`Renamed to: ${newName}`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to rename: ${error}`);
                }
            }
        });
        context.subscriptions.push(renameCommand);

        const deleteCommand = vscode.commands.registerCommand('tokenCounter.delete', async (node: any) => {
            if (!node) return;
            const fileName = path.basename(node.uri.fsPath);
            const result = await vscode.window.showWarningMessage(
                `Are you sure you want to delete '${fileName}'?`,
                { modal: true },
                'Delete'
            );
            if (result === 'Delete') {
                try {
                    await vscode.workspace.fs.delete(node.uri, { recursive: true, useTrash: true });
                    provider.refresh();
                    vscode.window.showInformationMessage(`Deleted: ${fileName}`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to delete: ${error}`);
                }
            }
        });
        context.subscriptions.push(deleteCommand);

        const copyCommand = vscode.commands.registerCommand('tokenCounter.copy', async (node: any) => {
            if (!node) return;
            try {
                await vscode.env.clipboard.writeText(node.uri.fsPath);
                vscode.window.showInformationMessage('Path copied to clipboard');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to copy: ${error}`);
            }
        });
        context.subscriptions.push(copyCommand);

        const cutCommand = vscode.commands.registerCommand('tokenCounter.cut', async (node: any) => {
            if (!node) return;
            try {
                await vscode.env.clipboard.writeText(JSON.stringify({
                    action: 'cut',
                    path: node.uri.fsPath
                }));
                vscode.window.showInformationMessage('Cut to clipboard');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to cut: ${error}`);
            }
        });
        context.subscriptions.push(cutCommand);

        const pasteCommand = vscode.commands.registerCommand('tokenCounter.paste', async (node: any) => {
            try {
                const clipboardText = await vscode.env.clipboard.readText();
                const clipboardData = JSON.parse(clipboardText);
                
                if (clipboardData.action === 'cut' && clipboardData.path) {
                    const sourceUri = vscode.Uri.file(clipboardData.path);
                    const targetUri = node ? node.uri : vscode.workspace.workspaceFolders?.[0]?.uri;
                    
                    if (targetUri) {
                        const fileName = path.basename(sourceUri.fsPath);
                        const newUri = vscode.Uri.joinPath(targetUri, fileName);
                        await vscode.workspace.fs.rename(sourceUri, newUri, { overwrite: false });
                        provider.refresh();
                        vscode.window.showInformationMessage(`Moved: ${fileName}`);
                    }
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to paste: ${error}`);
            }
        });
        context.subscriptions.push(pasteCommand);

        const duplicateCommand = vscode.commands.registerCommand('tokenCounter.duplicate', async (node: any) => {
            if (!node) return;
            try {
                const originalPath = node.uri.fsPath;
                const ext = path.extname(originalPath);
                const baseName = path.basename(originalPath, ext);
                const dirName = path.dirname(originalPath);
                
                let counter = 1;
                let newPath: string;
                do {
                    newPath = path.join(dirName, `${baseName}_copy${counter}${ext}`);
                    counter++;
                } while (await vscode.workspace.fs.stat(vscode.Uri.file(newPath)).then(() => true, () => false));
                
                const content = await vscode.workspace.fs.readFile(node.uri);
                await vscode.workspace.fs.writeFile(vscode.Uri.file(newPath), content);
                provider.refresh();
                vscode.window.showInformationMessage(`Duplicated: ${path.basename(newPath)}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to duplicate: ${error}`);
            }
        });
        context.subscriptions.push(duplicateCommand);

        const revealInExplorerCommand = vscode.commands.registerCommand('tokenCounter.revealInExplorer', async (node: any) => {
            if (!node) return;
            try {
                await vscode.commands.executeCommand('revealFileInOS', node.uri);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to reveal in explorer: ${error}`);
            }
        });
        context.subscriptions.push(revealInExplorerCommand);

        const openInTerminalCommand = vscode.commands.registerCommand('tokenCounter.openInTerminal', async (node: any) => {
            if (!node) return;
            try {
                const terminal = vscode.window.createTerminal({
                    name: 'Token Counter Terminal',
                    cwd: node.uri.fsPath
                });
                terminal.show();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open terminal: ${error}`);
            }
        });
        context.subscriptions.push(openInTerminalCommand);

        const selectAllCommand = vscode.commands.registerCommand('tokenCounter.selectAll', async () => {
            if (!vscode.workspace.workspaceFolders) {
                vscode.window.showWarningMessage('ワークスペースが開かれていません');
                return;
            }
            
            try {
                const workspaceRoot = vscode.workspace.workspaceFolders[0].uri;
                const entries = await provider.readDirectory(workspaceRoot);
                const allPaths = entries.map(([name, type]) => vscode.Uri.joinPath(workspaceRoot, name).fsPath);
                
                await provider.selectMultiple(allPaths, false);
                provider.refresh(); // Refresh to show selection state
                vscode.window.showInformationMessage(`${allPaths.length}個のアイテムを選択しました`);
            } catch (error) {
                vscode.window.showErrorMessage(`全選択に失敗しました: ${error}`);
            }
        });
        context.subscriptions.push(selectAllCommand);

        const collapseAllCommand = vscode.commands.registerCommand('tokenCounter.collapseAll', async () => {
            try {
                provider.collapseAll();
                vscode.window.showInformationMessage('Collapsed all folders');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to collapse all: ${error}`);
            }
        });
        context.subscriptions.push(collapseAllCommand);

        const expandAllCommand = vscode.commands.registerCommand('tokenCounter.expandAll', async () => {
            try {
                provider.expandAll();
                vscode.window.showInformationMessage('Expanded all folders');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to expand all: ${error}`);
            }
        });
        context.subscriptions.push(expandAllCommand);

        const sortByNameCommand = vscode.commands.registerCommand('tokenCounter.sortByName', async () => {
            provider.setSortMode('name');
            vscode.window.showInformationMessage('Sorted by name');
        });
        context.subscriptions.push(sortByNameCommand);

        const sortBySizeCommand = vscode.commands.registerCommand('tokenCounter.sortBySize', async () => {
            provider.setSortMode('size');
            vscode.window.showInformationMessage('Sorted by size');
        });
        context.subscriptions.push(sortBySizeCommand);

        const sortByDateCommand = vscode.commands.registerCommand('tokenCounter.sortByDate', async () => {
            provider.setSortMode('date');
            vscode.window.showInformationMessage('Sorted by date');
        });
        context.subscriptions.push(sortByDateCommand);

        const sortByTokensCommand = vscode.commands.registerCommand('tokenCounter.sortByTokens', async () => {
            provider.setSortMode('tokens');
            vscode.window.showInformationMessage('Sorted by token count');
        });
        context.subscriptions.push(sortByTokensCommand);

        const toggleSortDirectionCommand = vscode.commands.registerCommand('tokenCounter.toggleSortDirection', async () => {
            provider.toggleSortDirection();
            vscode.window.showInformationMessage('Toggled sort direction');
        });
        context.subscriptions.push(toggleSortDirectionCommand);

        const filterFilesCommand = vscode.commands.registerCommand('tokenCounter.filterFiles', async () => {
            const filter = await vscode.window.showInputBox({
                prompt: 'Enter filter pattern (supports wildcards)',
                placeHolder: '*.js, test*, etc.'
            });
            if (filter !== undefined) {
                provider.setFilter(filter);
                vscode.window.showInformationMessage(filter ? `Filtered: ${filter}` : 'Filter cleared');
            }
        });
        context.subscriptions.push(filterFilesCommand);

        const clearFilterCommand = vscode.commands.registerCommand('tokenCounter.clearFilter', async () => {
            provider.setFilter('');
            vscode.window.showInformationMessage('Filter cleared');
        });
        context.subscriptions.push(clearFilterCommand);

        const openWithCommand = vscode.commands.registerCommand('tokenCounter.openWith', async (node: any) => {
            if (!node) return;
            try {
                await vscode.commands.executeCommand('vscode.openWith', node.uri);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open with: ${error}`);
            }
        });
        context.subscriptions.push(openWithCommand);

        const compareSelectedCommand = vscode.commands.registerCommand('tokenCounter.compareSelected', async (node: any) => {
            if (!node) return;
            try {
                const selection = await vscode.window.showOpenDialog({
                    canSelectFiles: true,
                    canSelectFolders: false,
                    canSelectMany: false,
                    openLabel: 'Select file to compare with'
                });
                if (selection && selection[0]) {
                    await vscode.commands.executeCommand('vscode.diff', node.uri, selection[0]);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to compare: ${error}`);
            }
        });
        context.subscriptions.push(compareSelectedCommand);

        const showPropertiesCommand = vscode.commands.registerCommand('tokenCounter.showProperties', async (node: any) => {
            if (!node) return;
            try {
                const stat = await vscode.workspace.fs.stat(node.uri);
                const size = stat.size;
                const created = new Date(stat.ctime).toLocaleString('ja-JP');
                const modified = new Date(stat.mtime).toLocaleString('ja-JP');
                const type = stat.type === vscode.FileType.Directory ? 'フォルダ' : 'ファイル';
                const basename = path.basename(node.uri.fsPath);
                const extension = path.extname(node.uri.fsPath);
                const dirname = path.dirname(node.uri.fsPath);
                const tokenCount = await provider.getTokenCountPublic(node.uri, stat.type);
                
                const panel = vscode.window.createWebviewPanel(
                    'fileProperties',
                    `プロパティ: ${basename}`,
                    vscode.ViewColumn.Two,
                    {
                        enableScripts: true,
                        retainContextWhenHidden: true
                    }
                );
                
                panel.webview.html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>ファイルプロパティ</title>
                        <style>
                            body {
                                font-family: var(--vscode-font-family);
                                font-size: var(--vscode-font-size);
                                color: var(--vscode-foreground);
                                background-color: var(--vscode-editor-background);
                                padding: 20px;
                                line-height: 1.6;
                            }
                            .property-group {
                                margin-bottom: 20px;
                                border: 1px solid var(--vscode-panel-border);
                                border-radius: 4px;
                                padding: 15px;
                            }
                            .property-group h3 {
                                margin-top: 0;
                                color: var(--vscode-textLink-foreground);
                                border-bottom: 1px solid var(--vscode-panel-border);
                                padding-bottom: 5px;
                            }
                            .property-row {
                                display: flex;
                                justify-content: space-between;
                                margin: 8px 0;
                                padding: 4px 0;
                            }
                            .property-label {
                                font-weight: bold;
                                color: var(--vscode-textPreformat-foreground);
                                min-width: 120px;
                            }
                            .property-value {
                                color: var(--vscode-foreground);
                                word-break: break-all;
                                text-align: right;
                                flex: 1;
                                margin-left: 10px;
                            }
                            .file-icon {
                                font-size: 48px;
                                text-align: center;
                                margin-bottom: 15px;
                                color: var(--vscode-textLink-foreground);
                            }
                            .copy-button {
                                background-color: var(--vscode-button-background);
                                color: var(--vscode-button-foreground);
                                border: none;
                                padding: 4px 8px;
                                border-radius: 2px;
                                cursor: pointer;
                                font-size: 12px;
                                margin-left: 5px;
                            }
                            .copy-button:hover {
                                background-color: var(--vscode-button-hoverBackground);
                            }
                        </style>
                    </head>
                    <body>
                        <div class="file-icon">${stat.type === vscode.FileType.Directory ? '📁' : '📄'}</div>
                        
                        <div class="property-group">
                            <h3>基本情報</h3>
                            <div class="property-row">
                                <span class="property-label">名前:</span>
                                <span class="property-value">${basename}</span>
                            </div>
                            <div class="property-row">
                                <span class="property-label">種類:</span>
                                <span class="property-value">${type}</span>
                            </div>
                            ${stat.type !== vscode.FileType.Directory ? `
                            <div class="property-row">
                                <span class="property-label">拡張子:</span>
                                <span class="property-value">${extension || 'なし'}</span>
                            </div>
                            ` : ''}
                        </div>
                        
                        <div class="property-group">
                            <h3>場所</h3>
                            <div class="property-row">
                                <span class="property-label">フルパス:</span>
                                <span class="property-value">${node.uri.fsPath}
                                    <button class="copy-button" onclick="copyToClipboard('${node.uri.fsPath}')">コピー</button>
                                </span>
                            </div>
                            <div class="property-row">
                                <span class="property-label">ディレクトリ:</span>
                                <span class="property-value">${dirname}</span>
                            </div>
                        </div>
                        
                        <div class="property-group">
                            <h3>サイズとトークン</h3>
                            <div class="property-row">
                                <span class="property-label">サイズ:</span>
                                <span class="property-value">${provider.formatFileSizePublic(size)} (${size.toLocaleString()} バイト)</span>
                            </div>
                            <div class="property-row">
                                <span class="property-label">トークン数:</span>
                                <span class="property-value">${tokenCount.toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <div class="property-group">
                            <h3>日時</h3>
                            <div class="property-row">
                                <span class="property-label">作成日時:</span>
                                <span class="property-value">${created}</span>
                            </div>
                            <div class="property-row">
                                <span class="property-label">更新日時:</span>
                                <span class="property-value">${modified}</span>
                            </div>
                        </div>
                        
                        <script>
                            function copyToClipboard(text) {
                                navigator.clipboard.writeText(text).then(() => {
                                    console.log('Path copied to clipboard');
                                }).catch(err => {
                                    console.error('Failed to copy: ', err);
                                });
                            }
                        </script>
                    </body>
                    </html>
                `;
            } catch (error) {
                vscode.window.showErrorMessage(`プロパティ表示エラー: ${error}`);
            }
        });
        context.subscriptions.push(showPropertiesCommand);

        const toggleHiddenFilesCommand = vscode.commands.registerCommand('tokenCounter.toggleHiddenFiles', async () => {
            const config = vscode.workspace.getConfiguration('tokenCounter');
            const current = config.get<boolean>('showHiddenFiles', false);
            await config.update('showHiddenFiles', !current, vscode.ConfigurationTarget.Workspace);
            provider.refresh();
            vscode.window.showInformationMessage(`Hidden files ${!current ? 'shown' : 'hidden'}`);
        });
        context.subscriptions.push(toggleHiddenFilesCommand);

        const openInNewWindowCommand = vscode.commands.registerCommand('tokenCounter.openInNewWindow', async (node: any) => {
            if (!node) return;
            try {
                await vscode.commands.executeCommand('vscode.openFolder', node.uri, true);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open in new window: ${error}`);
            }
        });
        context.subscriptions.push(openInNewWindowCommand);

        const searchFilesCommand = vscode.commands.registerCommand('tokenCounter.searchFiles', async () => {
            const currentSearch = provider.getSearchTerm();
            const searchTerm = await vscode.window.showInputBox({
                prompt: '高度なファイル検索（正規表現、ワイルドカード、拡張子フィルター対応）',
                placeHolder: 'ファイル名、/regex/、*.js、.txt など...',
                value: currentSearch,
                validateInput: (value) => {
                    if (!value) return null;
                    
                    if (value.startsWith('/') && value.endsWith('/') && value.length > 2) {
                        try {
                            new RegExp(value.slice(1, -1), 'i');
                        } catch (error) {
                            return '無効な正規表現パターンです';
                        }
                    }
                    return null;
                }
            });
            if (searchTerm !== undefined) {
                if (searchTerm.trim() === '') {
                    provider.clearSearch();
                    vscode.window.showInformationMessage('検索をクリアしました');
                } else {
                    provider.setSearchTerm(searchTerm);
                    let searchType = 'ファジー検索';
                    if (searchTerm.startsWith('/') && searchTerm.endsWith('/')) {
                        searchType = '正規表現検索';
                    } else if (searchTerm.startsWith('.')) {
                        searchType = '拡張子フィルター';
                    } else if (searchTerm.includes('*') || searchTerm.includes('?')) {
                        searchType = 'ワイルドカード検索';
                    }
                    vscode.window.showInformationMessage(`${searchType}: ${searchTerm}`);
                }
            }
        });
        context.subscriptions.push(searchFilesCommand);

        const clearSearchCommand = vscode.commands.registerCommand('tokenCounter.clearSearch', () => {
            provider.clearSearch();
            vscode.window.showInformationMessage('検索をクリアしました');
        });
        context.subscriptions.push(clearSearchCommand);

        const findInFilesCommand = vscode.commands.registerCommand('tokenCounter.findInFiles', async () => {
            try {
                await vscode.commands.executeCommand('workbench.action.findInFiles');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open find in files: ${error}`);
            }
        });
        context.subscriptions.push(findInFilesCommand);

        const goToFileCommand = vscode.commands.registerCommand('tokenCounter.goToFile', async () => {
            try {
                await vscode.commands.executeCommand('workbench.action.quickOpen');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open go to file: ${error}`);
            }
        });
        context.subscriptions.push(goToFileCommand);

        const showFileHistoryCommand = vscode.commands.registerCommand('tokenCounter.showFileHistory', async (node: any) => {
            if (!node) return;
            try {
                await vscode.commands.executeCommand('git.viewFileHistory', node.uri);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to show file history: ${error}`);
            }
        });
        context.subscriptions.push(showFileHistoryCommand);

        const selectItemCommand = vscode.commands.registerCommand('tokenCounter.selectItem', async (node: any, ctrlKey: boolean = false, shiftKey: boolean = false) => {
            if (!node) return;
            await provider.handleMultiSelect(node.uri.fsPath, ctrlKey, shiftKey);
        });
        context.subscriptions.push(selectItemCommand);

        const selectMultipleCommand = vscode.commands.registerCommand('tokenCounter.selectMultiple', async (nodes: any[]) => {
            if (!nodes || nodes.length === 0) return;
            const uris = nodes.map(node => node.uri.fsPath);
            await provider.selectMultiple(uris, false);
        });
        context.subscriptions.push(selectMultipleCommand);

        const getSelectedItemsCommand = vscode.commands.registerCommand('tokenCounter.getSelectedItems', () => {
            return provider.getSelectedItems();
        });
        context.subscriptions.push(getSelectedItemsCommand);

        const deleteSelectedCommand = vscode.commands.registerCommand('tokenCounter.deleteSelected', async () => {
            const selectedItems = provider.getSelectedItems();
            if (selectedItems.length === 0) {
                vscode.window.showWarningMessage('No items selected');
                return;
            }

            const result = await vscode.window.showWarningMessage(
                `Are you sure you want to delete ${selectedItems.length} item(s)?`,
                { modal: true },
                'Delete'
            );

            if (result === 'Delete') {
                for (const itemPath of selectedItems) {
                    try {
                        const uri = vscode.Uri.file(itemPath);
                        await vscode.workspace.fs.delete(uri, { recursive: true, useTrash: true });
                    } catch (error) {
                        vscode.window.showErrorMessage(`Failed to delete ${itemPath}: ${error}`);
                    }
                }
                provider.clearSelection();
                provider.refresh();
                vscode.window.showInformationMessage(`Deleted ${selectedItems.length} item(s)`);
            }
        });
        context.subscriptions.push(deleteSelectedCommand);

        const showFilePropertiesCommand = vscode.commands.registerCommand('tokenCounter.showFileProperties', async (node: any) => {
            if (!node) return;
            
            try {
                const stat = await vscode.workspace.fs.stat(node.uri);
                const relativePath = vscode.workspace.asRelativePath(node.uri);
                const tokenCount = await provider.getTokenCountPublic(node.uri, stat.type);
                
                let message = `File: ${path.basename(node.uri.fsPath)}\n`;
                message += `Path: ${relativePath}\n`;
                message += `Full Path: ${node.uri.fsPath}\n`;
                message += `Size: ${provider.formatFileSizePublic(stat.size)}\n`;
                message += `Modified: ${new Date(stat.mtime).toLocaleString()}\n`;
                message += `Created: ${new Date(stat.ctime).toLocaleString()}\n`;
                if (tokenCount > 0) {
                    message += `Token Count: ${tokenCount.toLocaleString()}\n`;
                }
                message += `Type: ${stat.type === vscode.FileType.Directory ? 'Folder' : 'File'}\n`;
                
                vscode.window.showInformationMessage(message, { modal: true });
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to get file properties: ${error}`);
            }
        });
        context.subscriptions.push(showFilePropertiesCommand);


        const revealInFileExplorerCommand = vscode.commands.registerCommand('tokenCounter.revealInFileExplorer', async (node: any) => {
            if (!node) return;
            
            try {
                await vscode.commands.executeCommand('revealFileInOS', node.uri);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to reveal in file explorer: ${error}`);
            }
        });
        context.subscriptions.push(revealInFileExplorerCommand);

        const openInIntegratedTerminalCommand = vscode.commands.registerCommand('tokenCounter.openInIntegratedTerminal', async (node: any) => {
            if (!node) return;
            
            try {
                const terminal = vscode.window.createTerminal({
                    name: `Terminal - ${path.basename(node.uri.fsPath)}`,
                    cwd: node.type === vscode.FileType.Directory ? node.uri.fsPath : path.dirname(node.uri.fsPath)
                });
                terminal.show();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open terminal: ${error}`);
            }
        });
        context.subscriptions.push(openInIntegratedTerminalCommand);
        
        let refreshTimeout: NodeJS.Timeout | undefined;
        const debouncedRefresh = (uri: vscode.Uri, changeType: string) => {
            console.log(`👁️ [WATCHER] ${changeType}: ${uri.fsPath}`);
            
            if (refreshTimeout) {
                clearTimeout(refreshTimeout);
            }
            
            refreshTimeout = setTimeout(async () => {
                try {
                    if (changeType === 'File changed' && provider.refreshSpecificFile) {
                        await provider.refreshSpecificFile(uri);
                    } else {
                        provider.refresh();
                    }
                    console.log(`🔄 [WATCHER] Real-time refresh completed for ${changeType}`);
                } catch (error) {
                    console.error(`❌ [WATCHER] Refresh failed:`, error);
                    provider.refresh();
                }
            }, 300); // 300ms debounce delay
        };

        const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');
        fileWatcher.onDidChange(uri => debouncedRefresh(uri, 'File changed'));
        fileWatcher.onDidCreate(uri => debouncedRefresh(uri, 'File created'));
        fileWatcher.onDidDelete(uri => debouncedRefresh(uri, 'File deleted'));
        context.subscriptions.push(fileWatcher);
        
        const textDocumentWatcher = vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.uri.scheme === 'file') {
                console.log(`📝 [TEXT-WATCHER] Document changed: ${event.document.uri.fsPath}`);
                debouncedRefresh(event.document.uri, 'Text document changed');
            }
        });
        context.subscriptions.push(textDocumentWatcher);
        
        const saveWatcher = vscode.workspace.onDidSaveTextDocument(document => {
            if (document.uri.scheme === 'file') {
                console.log(`💾 [SAVE-WATCHER] Document saved: ${document.uri.fsPath}`);
                setTimeout(async () => {
                    try {
                        if (provider.refreshSpecificFile) {
                            await provider.refreshSpecificFile(document.uri);
                        } else {
                            provider.refresh();
                        }
                        console.log(`✅ [SAVE-WATCHER] Token count updated immediately after save`);
                    } catch (error) {
                        console.error(`❌ [SAVE-WATCHER] Refresh failed:`, error);
                        provider.refresh();
                    }
                }, 100); // Minimal delay to ensure file is fully saved
            }
        });
        context.subscriptions.push(saveWatcher);
        
        const configWatcher = vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('tokenCounter.tokenizerType') ||
                event.affectsConfiguration('tokenCounter.openaiModel') ||
                event.affectsConfiguration('tokenCounter.anthropicModel')) {
                console.log('⚙️ [CONFIG-WATCHER] Tokenizer configuration changed');
                
                provider.clearTokenCache();
                
                provider.refresh();
                
                vscode.window.showInformationMessage('トークナイザー設定が変更されました。トークン数を再計算中...');
                console.log('✅ [CONFIG-WATCHER] Token counts refreshed after configuration change');
            }
        });
        context.subscriptions.push(configWatcher);
        
        console.log('✅ [ACTIVATION] Enhanced real-time file watchers and configuration watcher created');
        
        console.log('🎉 [ACTIVATION] Token Counter extension activation completed successfully!');
        
    } catch (error) {
        console.error('💥 [ACTIVATION] FATAL: Extension activation failed:', error);
        vscode.window.showErrorMessage(`Token Counter activation failed: ${error}`);
        throw error;
    }
}

export function deactivate() {}
