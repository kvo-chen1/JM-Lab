import { useState, useRef, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  error,
  placeholder = '请输入内容...',
  disabled = false,
}) => {
  const [editorContent, setEditorContent] = useState(content);
  const editorRef = useRef<any>(null);
  
  // 当外部content变化时更新编辑器内容
  useEffect(() => {
    if (content !== editorContent) {
      setEditorContent(content);
    }
  }, [content]);
  
  // 编辑器初始化完成后的回调
  const handleEditorInit = (evt: any, editor: any) => {
    editorRef.current = editor;
  };
  
  // 编辑器内容变化时的回调
  const handleEditorChange = (content: string, editor: any) => {
    setEditorContent(content);
    onChange(content);
  };
  
  return (
    <div className="space-y-2">
      <Editor
        apiKey={import.meta.env.VITE_TINYMCE_API_KEY || ''}
        value={editorContent}
        init={{
          height: 400,
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
          images_upload_url: '/api/upload/image',
          images_upload_credentials: true,
        }}
        onInit={handleEditorInit}
        onEditorChange={handleEditorChange}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}