interface SyntaxHighlighterProps {
  code: string;
  language: string;
  style?: string;
  className?: string;
}

// Simple syntax highlighter - displays code with basic styling
export function SyntaxHighlighter({
  code,
  language,
  className = "",
}: SyntaxHighlighterProps) {
  const highlightCode = (code: string, lang: string) => {
    let highlighted = code;
    if (lang === "typescript" || lang === "javascript") {
      highlighted = code
        .replace(/\b(import|from|const|let|var|function|class|async|await|export|default|return|if|else|for|while|do|switch|case|break|try|catch|finally|throw|new|extends|implements|interface|type|enum|namespace|module|as|this|super|static|public|private|protected|readonly|abstract|yield|of|in|instanceof|typeof|void|delete|get|set)\b/g, '<span style="color: #3b82f6;">$1</span>')
        .replace(/\/\/.*/g, '<span style="color: #22c55e;">$&</span>')
        .replace(/['"`].*?['"`]/g, '<span style="color: #fbbf24;">$&</span>');
    } else if (lang === "python") {
      highlighted = code
        .replace(/\b(import|from|def|class|if|elif|else|for|while|with|try|except|finally|return|yield|pass|break|continue|async|await|lambda|global|nonlocal|is|in|and|or|not|True|False|None)\b/g, '<span style="color: #3b82f6;">$1</span>')
        .replace(/#.*/g, '<span style="color: #22c55e;">$&</span>')
        .replace(/['"`].*?['"`]/g, '<span style="color: #fbbf24;">$&</span>');
    } else if (lang === "java") {
      highlighted = code
        .replace(/\b(import|package|class|interface|extends|implements|public|private|protected|static|final|abstract|synchronized|volatile|transient|native|strictfp|void|boolean|byte|char|short|int|long|float|double|new|this|super|throw|throws|try|catch|finally|if|else|for|while|do|switch|case|break|continue|return|assert|enum|instanceof)\b/g, '<span style="color: #3b82f6;">$1</span>')
        .replace(/\/\/.*/g, '<span style="color: #22c55e;">$&</span>')
        .replace(/['"`].*?['"`]/g, '<span style="color: #fbbf24;">$&</span>');
    }
    return highlighted;
  };

  return (
    <div className={`relative rounded-lg overflow-hidden bg-slate-900 ${className}`}>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code
          style={{ color: "#f1f5f9" }}
          dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }}
        />
      </pre>
    </div>
  );
}
