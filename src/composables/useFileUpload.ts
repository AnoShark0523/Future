import { ref } from 'vue'

interface FileUploadOptions {
  accept?: string[]
  maxSize?: number // in MB
  maxFiles?: number
}

export function useFileUpload(options: FileUploadOptions = {}) {
  const files = ref<File[]>([])
  const error = ref<string | null>(null)

  const validateFile = (file: File): boolean => {
    // Check file type
    if (options.accept && !options.accept.some(type => file.type.startsWith(type))) {
      error.value = `不支持的文件类型: ${file.type}`
      return false
    }

    // Check file size
    if (options.maxSize && file.size > options.maxSize * 1024 * 1024) {
      error.value = `文件大小超过限制: ${options.maxSize}MB`
      return false
    }

    // Check max files
    if (options.maxFiles && files.value.length >= options.maxFiles) {
      error.value = `最多上传 ${options.maxFiles} 个文件`
      return false
    }

    return true
  }

  const addFiles = (newFiles: FileList | File[]) => {
    error.value = null
    const fileArray = Array.from(newFiles)

    for (const file of fileArray) {
      if (validateFile(file)) {
        files.value.push(file)
      }
    }
  }

  const removeFile = (index: number) => {
    files.value.splice(index, 1)
  }

  const clearFiles = () => {
    files.value = []
    error.value = null
  }

  return {
    files,
    error,
    addFiles,
    removeFile,
    clearFiles
  }
}