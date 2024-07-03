import * as vscode from 'vscode';
import * as path from 'path';

interface ExtensionConfiguration {
    filePatterns: string[];
    ignorePatterns: string[];
    minimumCopyPercentage: number;
    useRelativePath: boolean;
}

export function activate(context: vscode.ExtensionContext) {
    let copyDisposable = vscode.commands.registerTextEditorCommand('editor.action.clipboardCopyAction', handleCopy);
    let cutDisposable = vscode.commands.registerTextEditorCommand('editor.action.clipboardCutAction', handleCopy);
	let copyAllFilesDisposable = vscode.commands.registerCommand('extension.copyAllFilesWithComments', copyAllOpenFilesWithComments);

    context.subscriptions.push(copyDisposable, cutDisposable, copyAllFilesDisposable);
}

function getConfiguration(): ExtensionConfiguration {
    const config = vscode.workspace.getConfiguration('Colophon');
    return {
        filePatterns: config.get('filePatterns', ['**/*']),
        ignorePatterns: config.get('ignorePatterns', []),
        minimumCopyPercentage: config.get('minimumCopyPercentage', 20),
        useRelativePath: config.get('useRelativePath', true)
    };
}

async function handleCopy(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) {
    const document = textEditor.document;
    const selection = textEditor.selection;
    const config = getConfiguration();

    if (!shouldProcessFile(document.fileName, config)) {
        // If the file doesn't match our patterns or is ignored, just perform the default copy
        await vscode.commands.executeCommand('editor.action.clipboardCopyAction');
        return;
    }

    const totalLines = document.lineCount;
    const selectedLines = selection.end.line - selection.start.line + 1;
    const copyPercentage = (selectedLines / totalLines) * 100;
	const selectedText = document.getText(selection);

    if (copyPercentage >= config.minimumCopyPercentage) {
        const header = await getCommentForFile(document, config);

        // Modify clipboard content
        await vscode.env.clipboard.writeText(header + selectedText);
    } else {
        // If the selection is smaller than the threshold, just perform the default copy
        await vscode.env.clipboard.writeText(selectedText);
    }
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

async function copyAllOpenFilesWithComments() {
    const config = getConfiguration();
    const visibleTextEditors = vscode.window.visibleTextEditors;

    let allText = '';
    let count = 0;

    for (const editor of visibleTextEditors) {
        const document = editor.document;
        if (shouldProcessFile(document.fileName, config)) {
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
