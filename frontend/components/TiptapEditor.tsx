"use client"

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Undo2, Redo2 } from 'lucide-react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
}

export default function TiptapEditor({ value, onChange, disabled, error, placeholder }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder ?? 'Enter notes…',
      }),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap outline-none min-h-[220px] px-4 py-3 text-sm text-slate-100 leading-relaxed',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const normalize = (h: string) => (!h || h === '<p></p>' ? '' : h);
    if (normalize(editor.getHTML()) !== normalize(value)) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  const btn = (
    onClick: () => void,
    active: boolean,
    title: string,
    children: React.ReactNode,
    isDisabled?: boolean,
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled ?? disabled}
      title={title}
      className={`p-1.5 rounded-lg transition-all disabled:opacity-25 disabled:cursor-not-allowed ${
        active
          ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30'
          : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.07]'
      }`}
    >
      {children}
    </button>
  );

  const sep = <div className="w-px h-4 bg-white/[0.08] mx-1 flex-shrink-0" />;

  return (
    <div
      className={`rounded-xl overflow-hidden transition-all ${disabled ? 'opacity-50' : ''} ${
        error
          ? 'border border-red-500/50 focus-within:ring-2 focus-within:ring-red-500/25 focus-within:border-red-500/70'
          : 'border border-white/[0.1] focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500/60'
      } bg-[#0A0E17]`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2.5 py-2 border-b border-white/[0.07] bg-[#080C14]">
        {btn(() => editor?.chain().focus().toggleBold().run(),         !!editor?.isActive('bold'),        'Bold (Ctrl+B)',  <Bold className="h-3.5 w-3.5" />)}
        {btn(() => editor?.chain().focus().toggleItalic().run(),       !!editor?.isActive('italic'),      'Italic (Ctrl+I)',<Italic className="h-3.5 w-3.5" />)}
        {sep}
        {btn(() => editor?.chain().focus().toggleBulletList().run(),   !!editor?.isActive('bulletList'),  'Bullet list',   <List className="h-3.5 w-3.5" />)}
        {btn(() => editor?.chain().focus().toggleOrderedList().run(),  !!editor?.isActive('orderedList'), 'Numbered list', <ListOrdered className="h-3.5 w-3.5" />)}
        {sep}
        {btn(() => editor?.chain().focus().undo().run(), false, 'Undo (Ctrl+Z)', <Undo2 className="h-3.5 w-3.5" />, disabled || !editor?.can().undo())}
        {btn(() => editor?.chain().focus().redo().run(), false, 'Redo (Ctrl+Y)', <Redo2 className="h-3.5 w-3.5" />, disabled || !editor?.can().redo())}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
