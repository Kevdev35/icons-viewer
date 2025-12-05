const vscode = require('vscode');

function activate(context) {
  let disposable = vscode.commands.registerCommand('iconsViewer.open', async () => {
    const libraries = {
      "Font Awesome": "https://fontawesome.com/icons",
      "Material Icons": "https://fonts.google.com/icons",
      "Heroicons": "https://heroicons.com/",
      "Lucide Icons": "https://lucide.dev/icons",
      "Feather Icons": "https://feathericons.com/",
      "Ionicons": "https://ionicons.com/",
      "Boxicons": "https://boxicons.com/",
      "Remix Icon": "https://remixicon.com/",
      "Bootstrap Icons": "https://icons.getbootstrap.com/",
      "Typicons": "https://www.s-ings.com/typicons/",
    };

    const pick = await vscode.window.showQuickPick(Object.keys(libraries), {
      placeHolder: 'Selecciona una biblioteca de íconos',
    });

    if (!pick) return;

    const url = libraries[pick];

    if (pick === "Font Awesome" || pick === "Material Icons") {
      vscode.env.openExternal(vscode.Uri.parse(url));
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'iconViewer',
      `${pick} — Icon Viewer`,
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );

    panel.webview.html = getWebviewContent(url);

    // 🔹 Escucha mensajes del WebView
    panel.webview.onDidReceiveMessage((message) => {
      if (message.command === 'openInBrowser') {
        vscode.env.openExternal(vscode.Uri.parse(message.url));
      }
    });
  });

  context.subscriptions.push(disposable);
}

function getWebviewContent(url) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        body, html {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
          font-family: sans-serif;
        }
        #toolbar {
          height: 40px;
          background: #1e1e1e;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 10px;
        }
        #openBrowser {
          background: #007acc;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        }
        iframe {
          width: 100%;
          height: calc(100% - 40px);
          border: none;
        }
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

function deactivate() {}

module.exports = { activate, deactivate };
