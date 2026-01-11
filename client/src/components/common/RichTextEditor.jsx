import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Link2,
  Image as ImageIcon,
  Undo,
  Redo,
  Minus
} from 'lucide-react';

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const buttonClass = (isActive = false) =>
    `p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${isActive ? 'bg-slate-200 dark:bg-slate-600 text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'
    }`;

  return (
    <div className="border-b border-slate-200 dark:border-slate-700 p-2 flex flex-wrap gap-1 bg-slate-50 dark:bg-slate-800/50 rounded-t-lg">
      {/* Text Formatting */}
      <div className="flex gap-1 border-r border-slate-200 dark:border-slate-700 pr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={buttonClass(editor.isActive('bold'))}
          title="Bold"
        >
          <Bold size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={buttonClass(editor.isActive('italic'))}
          title="Italic"
        >
          <Italic size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={buttonClass(editor.isActive('strike'))}
          title="Strikethrough"
        >
          <Strikethrough size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={buttonClass(editor.isActive('code'))}
          title="Inline Code"
        >
          <Code size={18} />
        </button>
      </div>

      {/* Headings */}
      <div className="flex gap-1 border-r border-slate-200 dark:border-slate-700 pr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={buttonClass(editor.isActive('heading', { level: 1 }))}
          title="Heading 1"
        >
          <Heading1 size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={buttonClass(editor.isActive('heading', { level: 2 }))}
          title="Heading 2"
        >
          <Heading2 size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={buttonClass(editor.isActive('heading', { level: 3 }))}
          title="Heading 3"
        >
          <Heading3 size={18} />
        </button>
      </div>

      {/* Lists */}
      <div className="flex gap-1 border-r border-slate-200 dark:border-slate-700 pr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={buttonClass(editor.isActive('bulletList'))}
          title="Bullet List"
        >
          <List size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={buttonClass(editor.isActive('orderedList'))}
          title="Numbered List"
        >
          <ListOrdered size={18} />
        </button>
      </div>

      {/* Quote & Code Block */}
      <div className="flex gap-1 border-r border-slate-200 dark:border-slate-700 pr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={buttonClass(editor.isActive('blockquote'))}
          title="Quote"
        >
          <Quote size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={buttonClass(editor.isActive('codeBlock'))}
          title="Code Block"
        >
          <Code size={18} />
        </button>
      </div>

      {/* Link & Image */}
      <div className="flex gap-1 border-r border-slate-200 dark:border-slate-700 pr-2">
        <button
          type="button"
          onClick={addLink}
          className={buttonClass(editor.isActive('link'))}
          title="Add Link"
        >
          <Link2 size={18} />
        </button>
        <button
          type="button"
          onClick={addImage}
          className={buttonClass()}
          title="Add Image"
        >
          <ImageIcon size={18} />
        </button>
      </div>

      {/* Divider & Undo/Redo */}
      <div className="flex gap-1 border-r border-slate-200 dark:border-slate-700 pr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={buttonClass()}
          title="Horizontal Line"
        >
          <Minus size={18} />
        </button>
      </div>

      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={`${buttonClass()} disabled:opacity-30 disabled:cursor-not-allowed`}
          title="Undo"
        >
          <Undo size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={`${buttonClass()} disabled:opacity-30 disabled:cursor-not-allowed`}
          title="Redo"
        >
          <Redo size={18} />
        </button>
      </div>
    </div>
  );
};

const RichTextEditor = ({
  content = '',
  onChange,
  placeholder = 'Start typing...',
  maxLength,
  showCharCount = false,
  editable = true,
  className = '',
  minHeight = '200px',
  error,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-slate dark:prose-invert max-w-none focus:outline-none ${editable ? 'min-h-[${minHeight}]' : ''
          }`,
      },
    },
  });

  // Update content when prop changes
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const characterCount = editor?.storage.characterCount.characters() || 0;
  const wordCount = editor?.storage.characterCount.words() || 0;

  return (
    <div className={className}>
      <div
        className={`border rounded-lg overflow-hidden ${error
            ? 'border-red-500 dark:border-red-400'
            : 'border-slate-300 dark:border-slate-600 focus-within:border-primary-500 dark:focus-within:border-primary-400'
          } ${!editable ? 'bg-slate-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-800'}`}
      >
        {editable && <MenuBar editor={editor} />}

        <div className={`p-4 ${editable ? '' : 'pt-2'}`} style={{ minHeight: editable ? minHeight : 'auto' }}>
          <EditorContent editor={editor} />
        </div>

        {showCharCount && editor && (
          <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
            <span>
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
            {maxLength && (
              <span className={characterCount > maxLength ? 'text-red-600 dark:text-red-400' : ''}>
                {characterCount} / {maxLength} characters
              </span>
            )}
            {!maxLength && (
              <span>{characterCount} characters</span>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default RichTextEditor;
