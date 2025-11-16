import React, { useEffect, useRef } from "react";

const inlineCommandList = [
  { label: "B", title: "Bold", command: "bold" },
  { label: "• List", title: "Bullet List", command: "insertUnorderedList" },
];

const highlightColors = ["#ffe08c", "#ffffff", "#000000", "#ff0000", "#00aa00", "#ff7fbf"];
const textColorMap = [
  { label: "글자색", command: "foreColor" },
];

export default function WysiwygEditor({ value = "", onChange }) {
  const contentRef = useRef(null);

  const execCommand = (command, option) => {
    document.execCommand(command, false, option || null);
    contentRef.current?.focus();
  };

  const toggleColor = (command, color) => {
    try {
      const current = document.queryCommandValue(command);
      const normalized = (current || "").toLowerCase().replace(/\s/g, "");
      const target = color.toLowerCase();
      if (
        normalized === target ||
        (normalized.startsWith("rgb(") && color.startsWith("#") && normalized.includes(color.slice(1)))
      ) {
        execCommand(command, "transparent");
        return;
      }
    } catch (err) {
      // ignore
    }
    execCommand(command, color);
  };

  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== (value || "")) {
      contentRef.current.innerHTML = value || "";
    }
  }, [value]);

  return (
    <div className="dc-editor">
      <div className="dc-editor-toolbar">
        {inlineCommandList.map((cmd) => (
          <button
            key={cmd.command}
            type="button"
            title={cmd.title}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => execCommand(cmd.command)}
            className="dc-editor-btn"
          >
            {cmd.label}
          </button>
        ))}
        <div className="dc-editor-color-palette">
          <span className="dc-editor-palette-label">글자색</span>
          {highlightColors.map((color) => (
            <button
              key={`fore-${color}`}
              type="button"
              title={`글자색 ${color}`}
              className="dc-editor-color-btn"
              style={{ color: "#fff", backgroundColor: color }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => toggleColor("foreColor", color)}
            />
          ))}
        </div>
        <div className="dc-editor-color-palette">
          <span className="dc-editor-palette-label">형광펜</span>
          {highlightColors.map((color) => (
            <button
              key={`back-${color}`}
              type="button"
              title={`형광펜 ${color}`}
              className="dc-editor-color-btn"
              style={{ backgroundColor: color }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => toggleColor("backColor", color)}
            />
          ))}
        </div>
        <button
          type="button"
          title="스타일 제거"
          className="dc-editor-btn"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => execCommand("removeFormat")}
        >
          초기화
        </button>
      </div>
      <div
        ref={contentRef}
        className="dc-editor-body"
        contentEditable
        role="textbox"
        aria-multiline="true"
        onInput={() => onChange(contentRef.current?.innerHTML || "")}
        suppressContentEditableWarning
      />
    </div>
  );
}
