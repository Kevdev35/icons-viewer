import * as vscode from 'vscode';
import * as https from 'https';

const libraryToIconifyId: Record<string, string> = {
  'lucide': 'lucide',
  'mdi': 'mdi',
  'heroicons': 'heroicons',
  'feather': 'feather',
  'ion': 'ion',
  'bx': 'bx',
  'ri': 'ri',
  'bi': 'bi',
  'typcn': 'typcn',
  'fa': 'fa'
};

export class IconDecorationProvider {
  private svgCache: Map<string, string> = new Map();
  private decorationType: vscode.TextEditorDecorationType;

  constructor() {
    this.decorationType = vscode.window.createTextEditorDecorationType({
      after: {
        margin: '0 0 0 8px',
        width: '18px',
        height: '18px',
        color: new vscode.ThemeColor('editor.foreground')
      }
    });
  }

  registerDecorations(context: vscode.ExtensionContext) {
    vscode.window.onDidChangeActiveTextEditor(
      (editor) => {
        if (editor) {
          this.updateDecorations(editor);
        }
      },
      null,
      context.subscriptions
    );

    vscode.workspace.onDidChangeTextDocument(
      (event) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
          this.updateDecorations(editor);
        }
      },
      null,
      context.subscriptions
    );

    if (vscode.window.activeTextEditor) {
      this.updateDecorations(vscode.window.activeTextEditor);
    }
  }

  private async updateDecorations(editor: vscode.TextEditor) {
    const document = editor.document;
    const decorations: vscode.DecorationOptions[] = [];
    const text = document.getText();
    const lines = text.split('\n');

    // Detectar librería del import
    const importMatch = text.match(/from\s+['"](lucide-react|@heroicons|@mdi|feather)/);
    const detectedLibrary = this.detectLibraryFromImport(importMatch?.[1]);

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];

      // Patrón 1: class="mdi mdi-cheese"
      const htmlPattern = /class="([^"]*?(bx|mdi|fa|icon)\s+([^"]*?)?[^"]*)"/g;
      let match;

      while ((match = htmlPattern.exec(line)) !== null) {
        const classStr = match[1];

        const bxMatch = classStr.match(/bx\s+bx-([\w-]+)/);
        if (bxMatch) {
          const decoration = await this.createDecoration(
            lineNum,
            match.index + match[0].length,
            bxMatch[1],
            'bx'
          );
          if (decoration) decorations.push(decoration);
          continue;
        }

        const mdiMatch = classStr.match(/mdi\s+mdi-([\w-]+)/);
        if (mdiMatch) {
          const decoration = await this.createDecoration(
            lineNum,
            match.index + match[0].length,
            mdiMatch[1],
            'mdi'
          );
          if (decoration) decorations.push(decoration);
          continue;
        }
      }

      // Patrón 2: <Heart />, <Home />
      const componentPattern = /<\s*([A-Z][A-Za-z0-9_]*)\b[^>]*\/>/g;

      while ((match = componentPattern.exec(line)) !== null) {
        const componentName = match[1];

        if (/^[A-Z]/.test(componentName)) {
          const iconName = this.pascalCaseToKebabCase(componentName);
          const library = detectedLibrary || 'lucide';

          const decoration = await this.createDecoration(
            lineNum,
            match.index + match[0].length,
            iconName,
            library
          );
          if (decoration) decorations.push(decoration);
        }
      }
    }

    editor.setDecorations(this.decorationType, decorations);
  }

  private async createDecoration(
    lineNum: number,
    charPos: number,
    iconName: string,
    library: string
  ): Promise<vscode.DecorationOptions | null> {
    try {
      const iconifyId = libraryToIconifyId[library];
      if (!iconifyId) return null;

      const svg = await this.getIconSVG(iconifyId, iconName);
      if (!svg) return null;

      const coloredSvg = svg
        .replace(/fill="currentColor"/g, 'fill="#d4d4d4"')
        .replace(/stroke="currentColor"/g, 'stroke="#d4d4d4"');

      // Codificar SVG para mostrarlo inline
      const encodedSvg = encodeURIComponent(coloredSvg);
      const imageUri = vscode.Uri.parse(`data:image/svg+xml,${encodedSvg}`);

      const decoration: vscode.DecorationOptions = {
        range: new vscode.Range(
          new vscode.Position(lineNum, charPos),
          new vscode.Position(lineNum, charPos)
        ),
        renderOptions: {
          after: {
            contentIconPath: imageUri,
            margin: '0 0 0 6px'
          }
        }
      };

      return decoration;
    } catch (error) {
      return null;
    }
  }

  private async getIconSVG(iconifyId: string, iconName: string): Promise<string | null> {
    const cacheKey = `${iconifyId}:${iconName}`;

    if (this.svgCache.has(cacheKey)) {
      return this.svgCache.get(cacheKey)!;
    }

    return new Promise((resolve) => {
      const url = `https://api.iconify.design/${iconifyId}/${iconName}.svg?height=18`;

      https
        .get(url, (response) => {
          let data = '';

          response.on('data', (chunk) => {
            data += chunk;
          });

          response.on('end', () => {
            if (data) {
              this.svgCache.set(cacheKey, data);
              resolve(data);
            } else {
              resolve(null);
            }
          });
        })
        .on('error', () => {
          resolve(null);
        });
    });
  }

  private detectLibraryFromImport(importPath?: string): string {
    if (!importPath) return 'lucide';
    if (importPath.includes('lucide')) return 'lucide';
    if (importPath.includes('heroicons')) return 'heroicons';
    if (importPath.includes('mdi')) return 'mdi';
    if (importPath.includes('feather')) return 'feather';
    return 'lucide';
  }

  private pascalCaseToKebabCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
  }
}