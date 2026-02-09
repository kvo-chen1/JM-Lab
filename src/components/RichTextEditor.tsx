import { useState, useRef, useEffect } from 'react';
import { SimpleHtmlEditor } from './SimpleHtmlEditor';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  height?: number | string;
}

// 动态导入 TinyMCE，避免 SSR 问题
let Editor: any = null;
let tinymceLoadAttempted = false;
let tinymceLoadFailed = false;

// 尝试加载 TinyMCE 编辑器
try {
  if (typeof window !== 'undefined' && !tinymceLoadAttempted) {
    tinymceLoadAttempted = true;
    const tinymceModule = require('@tinymce/tinymce-react');
    Editor = tinymceModule.Editor;
  }
} catch (e) {
  console.warn('TinyMCE editor not available:', e);
  tinymceLoadFailed = true;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  error,
  placeholder = '请输入内容...',
  disabled = false,
  height = 400,
}) => {
  const [editorContent, setEditorContent] = useState(content);
  const [useSimpleEditor, setUseSimpleEditor] = useState(tinymceLoadFailed);
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 当外部content变化时更新编辑器内容
  useEffect(() => {
    setEditorContent(content);
    if (editorRef.current && !useSimpleEditor) {
      editorRef.current.setContent(content);
    }
  }, [content, useSimpleEditor]);

  // 检测 TinyMCE 是否加载失败
  useEffect(() => {
    if (typeof window !== 'undefined' && !useSimpleEditor && containerRef.current) {
      const timer = setTimeout(() => {
        // 检查 TinyMCE 是否成功初始化
        const tinymceElements = containerRef.current?.querySelectorAll('.tox-tinymce');
        if (!tinymceElements || tinymceElements.length === 0) {
          console.warn('TinyMCE editor failed to load, switching to simple editor');
          setUseSimpleEditor(true);
        }
      }, 5000); // 5秒后检查

      return () => clearTimeout(timer);
    }
  }, [useSimpleEditor]);

  // 编辑器初始化完成后的回调
  const handleEditorInit = (evt: any, editor: any) => {
    editorRef.current = editor;
  };

  // 编辑器内容变化时的回调
  const handleEditorChange = (content: string, editor: any) => {
    setEditorContent(content);
    onChange(content);
  };

  // 简单编辑器模式 - 使用增强的 SimpleHtmlEditor
  if (useSimpleEditor || !Editor) {
    return (
      <div className={`space-y-2 ${height === '100%' ? 'h-full flex flex-col' : ''}`}>
        <SimpleHtmlEditor
          content={editorContent}
          onChange={(newContent) => {
            setEditorContent(newContent);
            onChange(newContent);
          }}
          placeholder={placeholder}
          disabled={disabled}
          height={height}
        />
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setUseSimpleEditor(false)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            重试加载富文本编辑器
          </button>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`space-y-2 ${height === '100%' ? 'h-full flex flex-col' : ''}`}>
      <Editor
        apiKey="equzoje2vbh50zcncs9mhg3ex32lr0y7sagjxhxtqrxbc3tp"
        value={editorContent}
        init={{
          height: height,
          menubar: true,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: `undo redo | formatselect | bold italic backcolor |
            alignleft aligncenter alignright alignjustify |
            bullist numlist outdent indent | removeformat | help`,
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
          placeholder: placeholder,
          readonly: disabled,
          images_upload_handler: function (blobInfo: any, success: any, failure: any) {
            const reader = new FileReader();
            reader.onload = function () {
              const base64 = reader.result;
              if (typeof base64 === 'string') {
                success(base64);
              } else {
                failure('图片上传失败');
              }
            };
            reader.onerror = function () {
              failure('图片上传失败');
            };
            reader.readAsDataURL(blobInfo.blob());
          },
          statusbar: false,
          branding: false,
          promotion: false,
          // 使用本地资源而不是 CDN（如果可能）
          skin: 'oxide',
          content_css: 'default',
        }}
        onInit={handleEditorInit}
        onEditorChange={handleEditorChange}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};
