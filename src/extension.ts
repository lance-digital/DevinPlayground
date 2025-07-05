import * as vscode from 'vscode';
import * as path from 'path';
import { TokenCounterFileSystemProvider } from './fileSystemProvider';
import { GitStatusProvider } from './gitStatusProvider';

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
        
        const gitStatusProvider = new GitStatusProvider();
        const gitDecorationProvider = vscode.window.registerFileDecorationProvider(gitStatusProvider);
        context.subscriptions.push(gitDecorationProvider);
        console.log('✅ [ACTIVATION] Git status decoration provider registered');
        
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
