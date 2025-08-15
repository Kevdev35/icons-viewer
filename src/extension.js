const vscode = require('vscode');

function activate(context) {
  let disposable = vscode.commands.registerCommand('iconsViewer.open', async function () {
    // Lista de librerías de iconos
    const options = [
      { label: 'React Icons', url: 'https://react-icons.github.io/react-icons/' },
      { label: 'Lucide Icons', url: 'https://lucide.dev/icons/' },
      { label: 'Heroicons', url: 'https://heroicons.com/' },
      { label: 'Tabler Icons', url: 'https://tabler.io/icons' }
    ];

    // Menú de selección
    const selected = await vscode.window.showQuickPick(options, {
      placeHolder: 'Selecciona la librería de iconos que quieres abrir'
    });

    if (!selected) return; // Si no selecciona nada, salir

    // Crear panel WebView
    const panel = vscode.window.createWebviewPanel(
      'iconsViewer',
      selected.label,
      vscode.ViewColumn.Two,
      { enableScripts: true }
    );

    // Cargar contenido
    panel.webview.html = getWebviewContent(selected.url);
  });

  context.subscriptions.push(disposable);
}

function getWebviewContent(url) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <body style="margin:0; padding:0; height:100vh;">
      <iframe src="${url}" style="border:none; width:100%; height:100%;"></iframe>
    </body>
    </html>
  `;
}

function deactivate() {}

module.exports = { activate, deactivate };
