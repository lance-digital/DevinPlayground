import * as vscode from 'vscode';
import * as path from 'path';
import { TokenCounterFileSystemProvider } from './fileSystemProvider';

export function activate(context: vscode.ExtensionContext) {
    try {
        console.log('🚀 [ACTIVATION] Token Counter extension activation started!');
        console.log('🚀 [ACTIVATION] VSCode version:', vscode.version);
        console.log('🚀 [ACTIVATION] Workspace folders:', vscode.workspace.workspaceFolders?.length || 0);
        
        const provider = new TokenCounterFileSystemProvider();
        console.log('✅ [ACTIVATION] TokenCounterFileSystemProvider created successfully');
        
        const treeView = vscode.window.createTreeView('tokenCounterExplorer', { 
            treeDataProvider: provider,
            showCollapseAll: true 
        });
        context.subscriptions.push(treeView);
        console.log('✅ [ACTIVATION] TreeView registered');
        
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
