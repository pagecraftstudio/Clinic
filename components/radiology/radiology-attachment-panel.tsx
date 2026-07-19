'use client'

import { useRef, useState, useTransition } from 'react'
import { Paperclip, Upload, Trash2, FileImage, File, ExternalLink } from 'lucide-react'
import { useDeleteRadiologyAttachment } from '@/features/radiology/hooks'
import { uploadRadiologyAttachment } from '@/features/radiology/actions'
import { useQueryClient } from '@tanstack/react-query'
import type { RadiologyAttachment } from '@/types/radiology'

interface Props {
  orderId: string
  attachments: RadiologyAttachment[]
}

function AttachmentIcon({ mime, isDicom }: { mime: string | null; isDicom: boolean }) {
  if (isDicom) return <File size={14} className="text-purple-400" />
  if (mime?.startsWith('image/')) return <FileImage size={14} className="text-blue-400" />
  return <File size={14} style={{ color: 'var(--text-muted)' }} />
}

export function RadiologyAttachmentPanel({ orderId, attachments }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const deleteAttachment = useDeleteRadiologyAttachment(orderId)
  const qc = useQueryClient()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)

    const fd = new FormData()
    fd.append('file', file)

    const res = await uploadRadiologyAttachment(orderId, fd)
    setUploading(false)

    if (!res.success) {
      setError(res.error ?? 'Upload failed')
    } else {
      qc.invalidateQueries({ queryKey: ['radiology-order', orderId] })
    }

    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this attachment?')) return
    await deleteAttachment.mutateAsync(id)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)' }}
    >
      <div
        className="px-5 py-4 flex items-center gap-2"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
      >
        <Paperclip size={14} style={{ color: 'var(--text-muted)' }} />
        <h2 className="text-[13px] font-semibold flex-1" style={{ color: 'var(--text-primary)' }}>
          Attachments
        </h2>
        <span className="text-[11px] mr-2" style={{ color: 'var(--text-muted)' }}>
          {attachments.length} file{attachments.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors disabled:opacity-60"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <Upload size={12} /> {uploading ? 'Uploading…' : 'Upload'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".dcm,.pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {error && (
        <p className="px-5 py-2 text-[12px]" style={{ color: 'var(--error, #f87171)', background: 'var(--bg-surface)' }}>
          {error}
        </p>
      )}

      <div style={{ background: 'var(--bg-elevated)' }}>
        {attachments.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Paperclip size={20} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              No attachments yet. Upload DICOM, PDF, or image files.
            </p>
          </div>
        ) : (
          attachments.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 px-5 py-3"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <AttachmentIcon mime={a.mime_type} isDicom={a.is_dicom} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {a.name}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {a.is_dicom ? 'DICOM' : a.mime_type ?? 'File'} · {new Date(a.created_at).toLocaleDateString()}
                </p>
              </div>
              <a
                href={a.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <ExternalLink size={13} />
              </a>
              <button
                onClick={() => handleDelete(a.id)}
                className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                style={{ color: 'var(--text-muted)' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
