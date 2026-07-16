import { useCallback, useRef, useState } from "react"

interface UseDropzoneOptions {
  onDrop: (files: File[]) => void
  accept?: Record<string, string[]>
  maxSize?: number
  maxFiles?: number
  disabled?: boolean
}

interface UseDropzoneReturn {
  getRootProps: () => {
    onDragOver: (e: React.DragEvent) => void
    onDragLeave: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
    onClick: () => void
  }
  getInputProps: () => {
    ref: React.RefObject<HTMLInputElement>
    type: string
    accept?: string
    multiple: boolean
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  }
  isDragActive: boolean
}

export function useDropzone(options: UseDropzoneOptions): UseDropzoneReturn {
  const { onDrop, accept, maxSize, maxFiles = 1, disabled = false } = options
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File ${file.name} exceeds the ${maxSize / 1024 / 1024}MB limit`
    }
    if (accept) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase()
      const allowedExts = Object.values(accept).flat()
      if (!allowedExts.includes(ext)) {
        return `File type ${ext} is not supported`
      }
    }
    return null
  }

  const processFiles = useCallback(
    (fileList: FileList) => {
      if (disabled) return
      const files = Array.from(fileList).slice(0, maxFiles)
      const errors: string[] = []
      const valid: File[] = []

      for (const file of files) {
        const error = validateFile(file)
        if (error) {
          errors.push(error)
        } else {
          valid.push(file)
        }
      }

      if (valid.length > 0) {
        onDrop(valid)
      }
    },
    [disabled, maxFiles, onDrop]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files)
      }
    },
    [processFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files)
      }
      // Reset so the same file can be selected again
      e.target.value = ""
    },
    [processFiles]
  )

  const acceptString = accept
    ? Object.values(accept)
        .flat()
        .join(",")
    : undefined

  return {
    getRootProps: () => ({
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      onClick: () => inputRef.current?.click(),
    }),
    getInputProps: () => ({
      ref: inputRef,
      type: "file",
      accept: acceptString,
      multiple: maxFiles > 1,
      onChange: handleInputChange,
    }),
    isDragActive,
  }
}
