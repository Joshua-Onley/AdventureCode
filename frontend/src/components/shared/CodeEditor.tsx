import React from 'react';
import { Editor } from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  height?: string;
  theme?: string;
  placeholder?: string;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  height = '300px',
  theme = 'vs-light',
  placeholder,
  readOnly = false
}) => {
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      <div className="bg-gray-50 text-gray-700 text-sm px-3 py-2 flex items-center justify-between border-b border-gray-200">
        <span className="font-mono font-medium">{language}</span>
        <span className="text-gray-500 text-xs">
          {readOnly ? 'Read Only' : 'Editable'}
        </span>
      </div>
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={handleEditorChange}
        theme={theme}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
          lineNumbers: 'on',
          rulers: [],
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          folding: true,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 3,
          renderLineHighlight: 'line',
          selectOnLineNumbers: true,
          roundedSelection: false,
          readOnly: readOnly,
          cursorStyle: 'line',
          bracketPairColorization: {
            enabled: true
          },
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false
          },
          ...(placeholder && !value && {
            placeholder: placeholder
          })
        }}
      />
    </div>
  );
};

export default CodeEditor;