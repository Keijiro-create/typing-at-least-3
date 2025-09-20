import { useCallback, useRef, useState } from 'react'

type SupportedImportType = 'json' | 'text'

type ImportedFile = {
  name: string
  type: SupportedImportType
  content: string
}

type DataImporterProps = {
  onImport: (files: ImportedFile[]) => void
  helperText?: string
}

function resolveImportType(file: File): SupportedImportType | null {
  const name = file.name.toLowerCase()
  if (name.endsWith('.json')) {
    return 'json'
  }
  if (name.endsWith('.txt')) {
    return 'text'
  }
  if (file.type === 'application/json') {
    return 'json'
  }
  if (file.type === 'text/plain') {
    return 'text'
  }
  return null
}

async function readFile(file: File): Promise<ImportedFile> {
  const importType = resolveImportType(file)
  if (!importType) {
    throw new Error(`Unsupported file type: ${file.name}`)
  }

  const content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsText(file)
  })

  return {
    name: file.name,
    type: importType,
    content,
  }
}

export function DataImporter({ onImport, helperText }: DataImporterProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) {
        return
      }

      const files = Array.from(fileList)
      setStatus('読み込み中...')

      try {
        const parsed = await Promise.all(files.map(readFile))
        onImport(parsed)
        setStatus(`${parsed.length} 件のファイルを読み込みました。`)
      } catch (error) {
        setStatus(error instanceof Error ? error.message : '読み込みに失敗しました。')
      } finally {
        if (inputRef.current) {
          inputRef.current.value = ''
        }
        setIsDragging(false)
      }
    },
    [onImport],
  )

  const onChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      void handleFiles(event.target.files)
    },
    [handleFiles],
  )

  const onDrop = useCallback<React.DragEventHandler<HTMLDivElement>>(
    (event) => {
      event.preventDefault()
      event.stopPropagation()
      void handleFiles(event.dataTransfer.files)
    },
    [handleFiles],
  )

  const onDragOver = useCallback<React.DragEventHandler<HTMLDivElement>>((event) => {
    event.preventDefault()
  }, [])

  const onDragEnter = useCallback<React.DragEventHandler<HTMLDivElement>>((event) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback<React.DragEventHandler<HTMLDivElement>>((event) => {
    event.preventDefault()
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return
    }
    setIsDragging(false)
  }, [])

  const helper = helperText ?? '.txt / .json のファイルをドラッグ&ドロップするか、ファイル選択から追加してください。'

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">データ導入</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">{helper}</p>
      </header>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        className={
          'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ' +
          (isDragging
            ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-300 dark:bg-slate-800 dark:text-sky-200'
            : 'border-slate-300 bg-white text-slate-600 hover:border-sky-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300')
        }
      >
        <span className="text-2xl font-semibold" aria-hidden="true">
          D&D
        </span>
        <p className="text-sm">
          ファイルをここにドロップ
          <br />
          または
        </p>
        <button
          type="button"
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:bg-sky-400 dark:hover:bg-sky-300 dark:text-slate-900"
          onClick={() => inputRef.current?.click()}
        >
          ファイルを選択
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.json,application/json,text/plain"
          multiple
          className="sr-only"
          onChange={onChange}
        />
      </div>

      {status ? (
        <p className="text-xs text-slate-500 dark:text-slate-400" role="status">
          {status}
        </p>
      ) : null}
    </section>
  )
}
