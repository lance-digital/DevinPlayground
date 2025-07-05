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
            dragAndDropController: provider
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
