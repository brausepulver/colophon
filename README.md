# Colophon

## Overview

VSCode extension that prepends a file name comment or relative path when copying large sections or entire contents of specified file types for use with LLMs.

## Features

- Automatically adds a comment with the file name or relative path when copying large sections or entire contents of a file.
- Configurable file patterns to specify which files should have headers inserted.
- Configurable ignore paths to exclude certain files or directories from processing.
- Configurable minimum copy percentage to determine when the header should be inserted.
- Configurable option to use the relative path instead of just the file name in the comment.

## Configuration Options

The extension provides the following configuration options under the `Colophon` namespace:

### `Colophon.filePatterns`

- **Type**: `array`
- **Default**: `["**/*"]`
- **Description**: File patterns to match for inserting headers. This option allows you to specify which files should have the headers inserted when copied. The patterns follow the glob syntax.

### `Colophon.ignorePaths`

- **Type**: `array`
- **Default**: `[]`
- **Description**: Paths to ignore when inserting headers. This option allows you to exclude certain files or directories from being processed by the extension.

### `Colophon.minimumCopyPercentage`

- **Type**: `number`
- **Default**: `20`
- **Description**: Minimum percentage of file content that needs to be copied for the header to be inserted. This option allows you to specify the threshold for when the file name comment should be added to the copied content.

### `Colophon.useRelativePath`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Use relative path instead of just the filename in comments. This option allows you to include the path of the file relative to the workspace root in the comment.

## How to Use

1. Install the Colophon extension from the Visual Studio Code marketplace.
2. Configure the extension settings according to your needs via the settings menu or by editing your `settings.json` file.
3. When you copy a large section or the entire contents of a file that matches the specified patterns, the file name or relative path will be included in the clipboard content as a comment.

## Example Configuration

```json
{
  "Colophon.filePatterns": ["**/*.js", "**/*.ts"],
  "Colophon.ignorePaths": ["node_modules", "dist"],
  "Colophon.minimumCopyPercentage": 50,
  "Colophon.useRelativePath": true
}
```

In this example, the extension will insert headers for JavaScript and TypeScript files, ignore files in the `node_modules` and `dist` directories, insert headers when at least 50% of the file content is copied, and use the relative path in the comment.

## License

This extension is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
