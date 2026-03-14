import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useTheme } from '@/hooks/useTheme';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Code, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Quote, 
  Undo,
  Redo,
  Image as ImageIcon,
  Link as LinkIcon,
  SeparatorHorizontal,
  Type
} from 'lucide-react';

interface RichTextEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  maxHeight?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  content = '',
  onChange,
  placeholder = '开始输入...',
  className = '',
  minHeight = '200px',
  maxHeight = '500px',
  disabled = false
}: RichTextEditorProps) {
  const { isDark } = useTheme();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        linkOnPaste: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const MenuButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false,
    children,
    title
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded-lg transition-all duration-200
        ${isActive 
          ? (isDark ? 'bg-indigo-500/30 text-indigo-400' : 'bg-indigo-100 text-indigo-600')
          : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  );

  const Divider = () => (
    <div className={`w-px h-6 mx-1 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
  );

  return (
    <div 
      className={`
        rounded-xl overflow-hidden border transition-all
        ${isDark 
          ? 'bg-slate-900 border-slate-700' 
          : 'bg-white border-gray-200'
        }
        ${disabled ? 'opacity-60' : ''}
        ${className}
      `}
    >
      {/* 工具栏 */}
      <div 
        className={`
          flex items-center gap-1 p-2 border-b flex-wrap
          ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}
        `}
      >
        {/* 撤销/重做 */}
        <MenuButton 
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          title="撤销"
        >
          <Undo size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          title="重做"
        >
          <Redo size={18} />
        </MenuButton>

        <Divider />

        {/* 标题 */}
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="标题 1"
        >
          <Heading1 size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="标题 2"
        >
          <Heading2 size={18} />
        </MenuButton>

        <Divider />

        {/* 文本样式 */}
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="粗体"
        >
          <Bold size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="斜体"
        >
          <Italic size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="删除线"
        >
          <Strikethrough size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="行内代码"
        >
          <Code size={18} />
        </MenuButton>

        <Divider />

        {/* 列表 */}
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="无序列表"
        >
          <List size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="有序列表"
        >
          <ListOrdered size={18} />
        </MenuButton>

        <Divider />

        {/* 引用和分割线 */}
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="引用"
        >
          <Quote size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="分割线"
        >
          <SeparatorHorizontal size={18} />
        </MenuButton>

        <Divider />

        {/* 链接和图片 */}
        <MenuButton 
          onClick={() => {
            const url = window.prompt('输入链接地址:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          isActive={editor.isActive('link')}
          title="插入链接"
        >
          <LinkIcon size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => {
            const url = window.prompt('输入图片地址:');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          title="插入图片"
        >
          <ImageIcon size={18} />
        </MenuButton>

        <Divider />

        {/* 清除格式 */}
        <MenuButton 
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="清除格式"
        >
          <Type size={18} />
        </MenuButton>
      </div>

      {/* 编辑器内容 */}
      <div 
        className={`
          overflow-y-auto
          ${isDark ? 'bg-slate-900' : 'bg-white'}
        `}
        style={{ minHeight, maxHeight }}
      >
        <EditorContent 
          editor={editor} 
          className={`
            prose max-w-none p-4
            ${isDark ? 'prose-invert' : ''}
            ${isDark ? '[&_.ProseMirror]:text-slate-200' : '[&_.ProseMirror]:text-gray-900'}
            [&_.ProseMirror]:min-h-[150px]
            [&_.ProseMirror]:outline-none
            [&_.ProseMirror_p]:my-2
            [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:my-3
            [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:my-3
            [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic
            ${isDark 
              ? '[&_.ProseMirror_blockquote]:border-slate-600 [&_.ProseMirror_blockquote]:text-slate-400'
              : '[&_.ProseMirror_blockquote]:border-gray-300 [&_.ProseMirror_blockquote]:text-gray-600'
            }
            [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5
            [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5
            [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded
            ${isDark 
              ? '[&_.ProseMirror_code]:bg-slate-800 [&_.ProseMirror_code]:text-slate-200'
              : '[&_.ProseMirror_code]:bg-gray-100 [&_.ProseMirror_code]:text-gray-800'
            }
            [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:overflow-x-auto
            ${isDark 
              ? '[&_.ProseMirror_pre]:bg-slate-800'
              : '[&_.ProseMirror_pre]:bg-gray-100'
            }
            [&_.ProseMirror_pre_code]:bg-transparent [&_.ProseMirror_pre_code]:p-0
            [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:my-2
            [&_.ProseMirror_hr]:my-4
            [&_.ProseMirror_a]:text-indigo-500 [&_.ProseMirror_a]:underline
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-400
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
            [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0
          `}
        />
      </div>

      {/* 底部状态栏 */}
      <div 
        className={`
          flex items-center justify-between px-4 py-2 text-xs border-t
          ${isDark ? 'border-slate-700 text-slate-500' : 'border-gray-200 text-gray-500'}
        `}
      >
        <span>
          {editor.storage.characterCount?.characters?.() || editor.getText().length} 字符
        </span>
        <span>
          {editor.getText().split(/\s+/).filter(w => w.length > 0).length} 词
        </span>
      </div>

      {/* 气泡菜单（选中文字时显示） */}
      {editor && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }}
          className={`
            flex items-center gap-1 p-1 rounded-lg shadow-lg border
            ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}
          `}
        >
          <MenuButton 
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
          >
            <Bold size={16} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
          >
            <Italic size={16} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
          >
            <Strikethrough size={16} />
          </MenuButton>
          <MenuButton 
            onClick={() => {
              const url = window.prompt('输入链接地址:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            isActive={editor.isActive('link')}
          >
            <LinkIcon size={16} />
          </MenuButton>
        </BubbleMenu>
      )}

      {/* 浮动菜单（空行时显示） */}
      {editor && (
        <FloatingMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }}
          className={`
            flex items-center gap-1 p-1 rounded-lg shadow-lg border
            ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}
          `}
        >
          <MenuButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
          >
            <Heading1 size={16} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
          >
            <Heading2 size={16} />
          </MenuButton>
          <MenuButton 
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
          >
            <List size={16} />
          </MenuButton>
        </FloatingMenu>
      )}
    </div>
  );
}

export default RichTextEditor;
