import * as vscode from 'vscode';
import { IconCompletionProvider } from './intellisense/iconCompletion';
import { IconDecorationProvider } from './hover/iconDecorator';
import { libraries } from './libraries/index';

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('iconsViewer');

  // Registrar decoraciones inline de iconos
  const decorationProvider = new IconDecorationProvider();
  decorationProvider.registerDecorations(context);

  // Registrar IntelliSense
  if (config.get<boolean>('enableIntelliSense') !== false) {
    const completionProvider = new IconCompletionProvider();

    const disposableReact = vscode.languages.registerCompletionItemProvider(
      { scheme: 'file', language: 'typescriptreact' },
      completionProvider
    );

    const disposableSvelte = vscode.languages.registerCompletionItemProvider(
      { scheme: 'file', language: 'svelte' },
      completionProvider
    );

    context.subscriptions.push(disposableReact, disposableSvelte);
  }

  // Registrar comando Webview
  if (config.get<boolean>('enableWebview') !== false) {
    const disposableCommand = vscode.commands.registerCommand(
      'iconsViewer.open',
      async (selectedLib?: string) => {
        const pick =
          selectedLib ||
          (await vscode.window.showQuickPick(
            Object.keys(libraries) as Array<keyof typeof libraries>,
            { placeHolder: 'Selecciona una biblioteca de íconos' }
          ));

        if (!pick) return;
        const url = libraries[pick as keyof typeof libraries];
        if (!url) return;

        if (pick === 'Font Awesome' || pick === 'Material Icons') {
          vscode.env.openExternal(vscode.Uri.parse(url));
          return;
        }

        const panel = vscode.window.createWebviewPanel(
          'iconsViewer',
          `${pick} — Icons Viewer`,
          vscode.ViewColumn.Beside,
          { enableScripts: true }
        );

        panel.webview.html = getWebviewContent(url);

        panel.webview.onDidReceiveMessage((msg) => {
          if (msg.command === 'openInBrowser') {
            vscode.env.openExternal(vscode.Uri.parse(msg.url));
          }
        });
      }
    );

    context.subscriptions.push(disposableCommand);
  }
}

function getWebviewContent(url: string): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        body, html { margin:0; padding:0; height:100%; font-family:sans-serif; overflow:hidden; }
        #toolbar {
          height: 40px; background:#1e1e1e; color:white; display:flex; justify-content:space-between; align-items:center; padding:0 10px;
        }
        #openBrowser {
          background:#181818ff; color:white; border:1px solid #333; padding:6px 12px; border-radius:10px; cursor:pointer; font-size:13px;
        }
        iframe { width:100%; height:calc(100% - 40px); border:none; }
      </style>
    </head>
    <body>
      <div id="toolbar">
        <span>🌐 Vista previa: ${new URL(url).hostname}</span>
        <button id="openBrowser">Abrir en navegador</button>
      </div>
      <iframe src="${url}" sandbox="allow-scripts allow-same-origin allow-popups"></iframe>
      <script>
        const vscode = acquireVsCodeApi();
        document.getElementById('openBrowser').addEventListener('click', () => {
          vscode.postMessage({ command: 'openInBrowser', url: '${url}' });
        });
      </script>
    </body>
    </html>
  `;
}

export function deactivate() {}