import React, { useState, useRef, useCallback } from 'react';
import { Editor } from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  height?: string;
  theme?: string;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: number;
  maxHeight?: number;
  resizable?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  height = '300px',
  theme = 'vs-light',
  placeholder,
  readOnly = false,
  minHeight = 100,
  maxHeight = 800,
  resizable = true
}) => {
  const [currentHeight, setCurrentHeight] = useState(() => {
    const numHeight = parseInt(height.replace('px', ''));
    return isNaN(numHeight) ? 300 : numHeight;
  });
  
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const startHeight = useRef<number>(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!resizable) return;
    
    e.preventDefault();
    setIsResizing(true);
    startY.current = e.clientY;
    startHeight.current = currentHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY.current;
      const newHeight = Math.max(
        minHeight,
        Math.min(maxHeight, startHeight.current + deltaY)
      );
      setCurrentHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [currentHeight, minHeight, maxHeight, resizable]);

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <div 
      ref={containerRef}
      className="border border-gray-300 rounded-lg overflow-hidden bg-white"
      style={{ userSelect: isResizing ? 'none' : 'auto' }}
    >
      <div className="bg-gray-50 text-gray-700 text-sm px-3 py-2 flex items-center justify-between border-b border-gray-200">
        <span className="font-mono font-medium">{language}</span>
        <div className="flex items-center gap-2">
          {resizable && (
            <span className="text-gray-400 text-xs">
              {currentHeight}px
            </span>
          )}
          <span className="text-gray-500 text-xs">
            {readOnly ? 'Read Only' : 'Editable'}
          </span>
        </div>
      </div>
      
      <div className="relative">
        <Editor
          height={`${currentHeight}px`}
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
        
        {resizable && (
          <div
            className={`
              absolute bottom-0 left-0 right-0 h-2 
              cursor-ns-resize bg-transparent
              hover:bg-blue-100 hover:border-t hover:border-blue-300
              transition-colors duration-150
              ${isResizing ? 'bg-blue-200 border-t border-blue-400' : ''}
            `}
            onMouseDown={handleMouseDown}
            title="Drag to resize"
          >
            <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex justify-center">
              <div className={`
                w-8 h-0.5 bg-gray-400 rounded-full
                ${isResizing ? 'bg-blue-500' : 'hover:bg-gray-500'}
                transition-colors duration-150
              `} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;