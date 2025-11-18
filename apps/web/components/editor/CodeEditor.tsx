"use client";

import { useState } from "react";

const languages = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
];

export type CodeEditorProps = {
  onSave: (code: string, language: string) => void;
  initialLanguage?: string;
  initialCode?: string;
};

export const CodeEditor = ({ onSave, initialCode = "", initialLanguage = "typescript" }: CodeEditorProps) => {
  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(initialCode);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <label className="text-sm font-medium text-slate-600" htmlFor="language-select">
          Language
        </label>
        <select
          id="language-select"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm shadow-sm"
        >
          {languages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => onSave(code, language)}
          className="ml-auto inline-flex items-center rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white shadow hover:bg-emerald-700"
        >
          Insert snippet
        </button>
      </div>
      <textarea
        value={code}
        onChange={(event) => setCode(event.target.value)}
        placeholder="Paste or write your code snippet..."
        className="flex-1 resize-none bg-slate-950 p-4 font-mono text-sm text-emerald-50 outline-none"
      />
    </div>
  );
};

export default CodeEditor;
