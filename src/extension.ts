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
            try {
                await vscode.commands.executeCommand('list.selectAll');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to select all: ${error}`);
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
                const created = new Date(stat.ctime).toLocaleString();
                const modified = new Date(stat.mtime).toLocaleString();
                const type = stat.type === vscode.FileType.Directory ? 'Folder' : 'File';
                
                const message = `Properties for ${path.basename(node.uri.fsPath)}:\n\n` +
                    `Type: ${type}\n` +
                    `Size: ${size} bytes\n` +
                    `Created: ${created}\n` +
                    `Modified: ${modified}\n` +
                    `Path: ${node.uri.fsPath}`;
                
                vscode.window.showInformationMessage(message, { modal: true });
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to show properties: ${error}`);
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
                prompt: 'ファイル名を検索（ファジー検索対応）',
                placeHolder: 'ファイル名またはパターンを入力...',
                value: currentSearch
            });
            if (searchTerm !== undefined) {
                if (searchTerm.trim() === '') {
                    provider.clearSearch();
                    vscode.window.showInformationMessage('検索をクリアしました');
                } else {
                    provider.setSearchTerm(searchTerm);
                    vscode.window.showInformationMessage(`検索中: ${searchTerm}`);
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
        
        const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');
        fileWatcher.onDidChange(uri => {
            console.log(`👁️ [WATCHER] File changed: ${uri.fsPath}`);
            provider.refresh();
        });
        fileWatcher.onDidCreate(uri => {
            console.log(`👁️ [WATCHER] File created: ${uri.fsPath}`);
            provider.refresh();
        });
        fileWatcher.onDidDelete(uri => {
            console.log(`👁️ [WATCHER] File deleted: ${uri.fsPath}`);
            provider.refresh();
        });
        context.subscriptions.push(fileWatcher);
        console.log('✅ [ACTIVATION] File watcher created');
        
        console.log('🎉 [ACTIVATION] Token Counter extension activation completed successfully!');
        
    } catch (error) {
        console.error('💥 [ACTIVATION] FATAL: Extension activation failed:', error);
        vscode.window.showErrorMessage(`Token Counter activation failed: ${error}`);
        throw error;
    }
}

export function deactivate() {}
