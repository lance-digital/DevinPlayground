import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

interface GitStatus {
    [filePath: string]: 'M' | 'A' | 'D' | 'R' | 'C' | 'U' | '?' | '!';
}

export class GitStatusProvider implements vscode.FileDecorationProvider {
    private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
    readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
    
    private gitStatusCache: Map<string, GitStatus> = new Map();
    private lastRefresh: number = 0;
    private refreshInterval = 5000;

    constructor() {
        this.refreshGitStatus();
        
        const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');
        fileWatcher.onDidChange(() => this.scheduleRefresh());
        fileWatcher.onDidCreate(() => this.scheduleRefresh());
        fileWatcher.onDidDelete(() => this.scheduleRefresh());
    }

    private scheduleRefresh() {
        const now = Date.now();
        if (now - this.lastRefresh > 1000) {
            this.refreshGitStatus();
        }
    }

    private async refreshGitStatus() {
        this.lastRefresh = Date.now();
        
        if (!vscode.workspace.workspaceFolders) {
            return;
        }

        for (const folder of vscode.workspace.workspaceFolders) {
            try {
                const gitStatus = await this.getGitStatus(folder.uri.fsPath);
                this.gitStatusCache.set(folder.uri.fsPath, gitStatus);
            } catch (error) {
                console.log(`No git repository found in ${folder.uri.fsPath}`);
            }
        }

        this._onDidChangeFileDecorations.fire(undefined);
    }

    private getGitStatus(workspaceRoot: string): Promise<GitStatus> {
        return new Promise((resolve, reject) => {
            cp.exec('git status --porcelain', { cwd: workspaceRoot }, (error, stdout) => {
                if (error) {
                    reject(error);
                    return;
                }

                const status: GitStatus = {};
                const lines = stdout.trim().split('\n').filter(line => line.length > 0);
                
                for (const line of lines) {
                    const statusCode = line.substring(0, 2);
                    const filePath = line.substring(3);
                    
                    let simpleStatus: GitStatus[string];
                    if (statusCode.includes('M')) simpleStatus = 'M';
                    else if (statusCode.includes('A')) simpleStatus = 'A';
                    else if (statusCode.includes('D')) simpleStatus = 'D';
                    else if (statusCode.includes('R')) simpleStatus = 'R';
                    else if (statusCode.includes('C')) simpleStatus = 'C';
                    else if (statusCode.includes('U')) simpleStatus = 'U';
                    else if (statusCode.includes('?')) simpleStatus = '?';
                    else simpleStatus = '!';
                    
                    status[filePath] = simpleStatus;
                }

                resolve(status);
            });
        });
    }

    provideFileDecoration(uri: vscode.Uri): vscode.ProviderResult<vscode.FileDecoration> {
        if (uri.scheme !== 'file') {
            return undefined;
        }

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) {
            return undefined;
        }

        const gitStatus = this.gitStatusCache.get(workspaceFolder.uri.fsPath);
        if (!gitStatus) {
            return undefined;
        }

        const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
        const status = gitStatus[relativePath];
        
        if (!status) {
            return undefined;
        }

        let badge: string;
        let color: vscode.ThemeColor;
        let tooltip: string;

        switch (status) {
            case 'M':
                badge = 'M';
                color = new vscode.ThemeColor('gitDecoration.modifiedResourceForeground');
                tooltip = 'Modified';
                break;
            case 'A':
                badge = 'A';
                color = new vscode.ThemeColor('gitDecoration.addedResourceForeground');
                tooltip = 'Added';
                break;
            case 'D':
                badge = 'D';
                color = new vscode.ThemeColor('gitDecoration.deletedResourceForeground');
                tooltip = 'Deleted';
                break;
            case 'R':
                badge = 'R';
                color = new vscode.ThemeColor('gitDecoration.renamedResourceForeground');
                tooltip = 'Renamed';
                break;
            case 'U':
                badge = 'U';
                color = new vscode.ThemeColor('gitDecoration.conflictingResourceForeground');
                tooltip = 'Unmerged';
                break;
            case '?':
                badge = 'U';
                color = new vscode.ThemeColor('gitDecoration.untrackedResourceForeground');
                tooltip = 'Untracked';
                break;
            default:
                return undefined;
        }

        return {
            badge,
            color,
            tooltip: `Git: ${tooltip}`
        };
    }
}
