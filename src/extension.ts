import * as vscode from 'vscode';
import * as path from 'path';

interface ExtensionConfiguration {
    filePatterns: string[];
    ignorePatterns: string[];
    useRelativePath: boolean;
}

export function activate(context: vscode.ExtensionContext) {
	let copyAllFilesDisposable = vscode.commands.registerCommand('extension.copyAllFilesWithComments', copyAllOpenFilesWithComments);

    context.subscriptions.push(copyAllFilesDisposable);
}

function getConfiguration(): ExtensionConfiguration {
    const config = vscode.workspace.getConfiguration('Colophon');
    return {
        filePatterns: config.get('filePatterns', ['**/*']),
        ignorePatterns: config.get('ignorePatterns', []),
        useRelativePath: config.get('useRelativePath', true)
    };
}

async function copyAllOpenFilesWithComments() {
    const config = getConfiguration();
    const textDocuments = vscode.workspace.textDocuments;

    let allText = '';
    let count = 0;

    for (const document of textDocuments) {
        if (!document.isClosed && shouldProcessFile(document.fileName, config)) {
            const header = getCommentForFile(document, config);
            const fileContent = document.getText();

            allText += header + fileContent + '\n\n';
            count++;
        }
    }

    allText = allText.trim();

    await vscode.env.clipboard.writeText(allText);
    vscode.window.showInformationMessage(`${count} open files copied with comments.`);
}

function shouldProcessFile(filePath: string, config: ExtensionConfiguration): boolean {
    const { filePatterns, ignorePatterns } = config;

    if (filePath === 'git/scm0/input' || filePath.endsWith('.git')) {
        return false;
    }

    // Check if the file should be ignored
    const ignored = ignorePatterns.some(pattern => {
        const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regexPattern.test(filePath);
    });

    if (ignored) {
        return false;
    }

    // Check if the file matches any of the patterns
    return filePatterns.some(pattern => {
        const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regexPattern.test(filePath);
    });
}

function getCommentForFile(document: vscode.TextDocument, config: ExtensionConfiguration): string {
    const languageId = document.languageId;
    const { commentStart, commentEnd } = getCommentCharacters(languageId);

    let filePath = path.basename(document.fileName);
    if (config.useRelativePath) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        if (workspaceFolder) {
            filePath = path.relative(workspaceFolder.uri.fsPath, document.fileName);
        }
    }

    if (commentEnd) {
        return `${commentStart} ${filePath} ${commentEnd}\n\n`;
    } else {
        return `${commentStart} ${filePath}\n\n`;
    }
}

function getCommentCharacters(languageId: string): { commentStart: string; commentEnd: string | null } {
    switch (languageId) {
        case 'javascript':
        case 'typescript':
        case 'java':
        case 'c':
        case 'cpp':
            return { commentStart: '//', commentEnd: null };
        case 'python':
            return { commentStart: '#', commentEnd: null };
        case 'html':
        case 'xml':
            return { commentStart: '<!--', commentEnd: '-->' };
        case 'css':
            return { commentStart: '/*', commentEnd: '*/' };
        default:
            return { commentStart: '//', commentEnd: null }; // Default to C-style comments
    }
}

export function deactivate() {}
