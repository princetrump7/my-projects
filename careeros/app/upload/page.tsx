"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Nav } from "@/components/nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/cn"
import { useDropzone } from "@/lib/use-dropzone"

export default function UploadPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "text/plain": [".txt"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 1,
  })

  const handleUpload = async () => {
    if (!file || !user) return
    setUploading(true)
    setProgress("Uploading file...")

    try {
      const formData = new FormData()
      formData.append("file", file)

      setProgress("Parsing CV...")
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Upload failed")
      }

      if (result.validation_errors?.length > 0) {
        toast({
          title: "Parsing warnings",
          description: result.validation_errors.join(". "),
          variant: "destructive",
        })
      }

      toast({
        title: "CV uploaded successfully!",
        description: "Redirecting to analysis...",
      })

      router.push(`/analyze?resume_id=${result.resume_id}`)
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setProgress("")
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Nav />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Upload Your CV</h1>
          <p className="text-muted-foreground mt-1">
            Upload your CV and let CareerOS analyze it for free.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Choose your file</CardTitle>
            <CardDescription>
              Supported formats: PDF, DOC, DOCX, TXT (max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                uploading && "pointer-events-none opacity-50"
              )}
            >
              <input {...getInputProps()} disabled={uploading} />
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <FileText className="h-12 w-12 text-primary" aria-hidden="true" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="font-medium">
                      {isDragActive ? "Drop your file here" : "Drag & drop your CV here"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse files
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">{progress}</span>
              </div>
            )}

            {/* Upload button */}
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full min-h-[48px]"
              size="lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" aria-hidden="true" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" aria-hidden="true" />
                  Upload & Analyze
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Tips */}
        <div className="mt-6 p-4 rounded-lg border bg-card">
          <h3 className="font-medium mb-2">Tips for best results</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" aria-hidden="true" />
              Use a clean PDF format for best parsing accuracy
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" aria-hidden="true" />
              Include a clear Skills section with technical and soft skills
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" aria-hidden="true" />
              Use bullet points for experience descriptions
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" aria-hidden="true" />
              Scanned PDFs (images) may not parse correctly — use text-based PDFs
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}
