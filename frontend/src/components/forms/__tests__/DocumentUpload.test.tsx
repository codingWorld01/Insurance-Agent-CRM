import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { DocumentUpload, type DocumentFile } from '../DocumentUpload'

// Mock hooks
vi.mock('@/hooks/useMobileDetection', () => ({
  useMobileDetection: () => ({
    isMobile: false,
    isTouchDevice: false,
  }),
}))

vi.mock('@/hooks/useEnhancedFileUpload', () => ({
  useEnhancedFileUpload: () => ({
    upload: vi.fn().mockResolvedValue('https://cloudinary.com/test-document.pdf'),
    isUploading: false,
  }),
}))

const mockOnDocumentsChange = vi.fn()
const mockOnUpload = vi.fn()

// Mock file for testing
const createMockFile = (name: string, size: number, type: string) => {
  const file = new File(['test content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('DocumentUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders upload area when no documents are present', () => {
    renderWithProviders(
      <DocumentUpload 
        documents={[]} 
        onDocumentsChange={mockOnDocumentsChange}
      />
    )

    expect(screen.getByText('Drop files here or click to browse')).toBeInTheDocument()
    expect(screen.getByText('Choose Files')).toBeInTheDocument()
    expect(screen.getByText('Supports PDF, DOC, DOCX, JPG, PNG, GIF (max 10MB each)')).toBeInTheDocument()
  })

  it('displays document type options', async () => {
    const user = userEvent.setup()
    const mockDocuments: DocumentFile[] = [{
      id: '1',
      file: createMockFile('test.pdf', 1024, 'application/pdf'),
      documentType: '',
      uploadProgress: 0,
      status: 'pending'
    }]

    renderWithProviders(
      <DocumentUpload 
        documents={mockDocuments} 
        onDocumentsChange={mockOnDocumentsChange}
      />
    )

    const selectTrigger = screen.getByText('Select document type')
    await user.click(selectTrigger)

    expect(screen.getByText('Identity Proof')).toBeInTheDocument()
    expect(screen.getByText('Address Proof')).toBeInTheDocument()
    expect(screen.getByText('Income Proof')).toBeInTheDocument()
    expect(screen.getByText('Medical Report')).toBeInTheDocument()
    expect(screen.getByText('Policy Document')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('validates file size limit', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <DocumentUpload 
        documents={[]} 
        onDocumentsChange={mockOnDocumentsChange}
      />
    )

    // Create a file larger than 10MB
    const largeFile = createMockFile('large.pdf', 11 * 1024 * 1024, 'application/pdf')
    
    const fileInput = screen.getByRole('button', { name: /choose files/i }).closest('div')?.querySelector('input[type="file"]')
    
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false,
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(mockOnDocumentsChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              status: 'error',
              error: 'File size too large. Maximum size is 10MB.'
            })
          ])
        )
      })
    }
  })

  it('validates file type restrictions', async () => {
    renderWithProviders(
      <DocumentUpload 
        documents={[]} 
        onDocumentsChange={mockOnDocumentsChange}
      />
    )

    // Create an unsupported file type
    const unsupportedFile = createMockFile('test.txt', 1024, 'text/plain')
    
    const fileInput = screen.getByRole('button', { name: /choose files/i }).closest('div')?.querySelector('input[type="file"]')
    
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [unsupportedFile],
        writable: false,
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(mockOnDocumentsChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              status: 'error',
              error: 'File type not supported. Please upload PDF, DOC, DOCX, JPG, PNG, or GIF files.'
            })
          ])
        )
      })
    }
  })

  it('displays document list with file information', () => {
    const mockDocuments: DocumentFile[] = [{
      id: '1',
      file: createMockFile('test-document.pdf', 2048, 'application/pdf'),
      documentType: 'IDENTITY_PROOF',
      uploadProgress: 0,
      status: 'pending'
    }]

    renderWithProviders(
      <DocumentUpload 
        documents={mockDocuments} 
        onDocumentsChange={mockOnDocumentsChange}
      />
    )

    expect(screen.getByText('test-document.pdf')).toBeInTheDocument()
    expect(screen.getByText('0.00 MB')).toBeInTheDocument()
    expect(screen.getByText('Documents (1/10)')).toBeInTheDocument()
  })

  it('allows document removal', async () => {
    const user = userEvent.setup()
    const mockDocuments: DocumentFile[] = [{
      id: '1',
      file: createMockFile('test.pdf', 1024, 'application/pdf'),
      documentType: 'IDENTITY_PROOF',
      uploadProgress: 0,
      status: 'pending'
    }]

    renderWithProviders(
      <DocumentUpload 
        documents={mockDocuments} 
        onDocumentsChange={mockOnDocumentsChange}
      />
    )

    const removeButton = screen.getByRole('button', { name: '' }) // X button
    await user.click(removeButton)

    expect(mockOnDocumentsChange).toHaveBeenCalledWith([])
  })

  it('shows upload progress for uploading documents', () => {
    const mockDocuments: DocumentFile[] = [{
      id: '1',
      file: createMockFile('test.pdf', 1024, 'application/pdf'),
      documentType: 'IDENTITY_PROOF',
      uploadProgress: 50,
      status: 'uploading'
    }]

    renderWithProviders(
      <DocumentUpload 
        documents={mockDocuments} 
        onDocumentsChange={mockOnDocumentsChange}
      />
    )

    expect(screen.getByText('Uploading...')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('shows success message for uploaded documents', () => {
    const mockDocuments: DocumentFile[] = [{
      id: '1',
      file: createMockFile('test.pdf', 1024, 'application/pdf'),
      documentType: 'IDENTITY_PROOF',
      uploadProgress: 100,
      status: 'success',
      cloudinaryUrl: 'https://cloudinary.com/test.pdf'
    }]

    renderWithProviders(
      <DocumentUpload 
        documents={mockDocuments} 
        onDocumentsChange={mockOnDocumentsChange}
      />
    )

    expect(screen.getByText('Document uploaded successfully')).toBeInTheDocument()
  })

  it('shows error message for failed uploads', () => {
    const mockDocuments: DocumentFile[] = [{
      id: '1',
      file: createMockFile('test.pdf', 1024, 'application/pdf'),
      documentType: 'IDENTITY_PROOF',
      uploadProgress: 0,
      status: 'error',
      error: 'Upload failed'
    }]

    renderWithProviders(
      <DocumentUpload 
        documents={mockDocuments} 
        onDocumentsChange={mockOnDocumentsChange}
      />
    )

    expect(screen.getByText('Upload failed')).toBeInTheDocument()
  })

  it('enables upload button when document type is selected', async () => {
    const user = userEvent.setup()
    const mockDocuments: DocumentFile[] = [{
      id: '1',
      file: createMockFile('test.pdf', 1024, 'application/pdf'),
      documentType: '',
      uploadProgress: 0,
      status: 'pending'
    }]

    renderWithProviders(
      <DocumentUpload 
        documents={mockDocuments} 
        onDocumentsChange={mockOnDocumentsChange}
      />
    )

    // Initially no upload button should be visible
    expect(screen.queryByText('Upload Document')).not.toBeInTheDocument()

    // Select document type
    const selectTrigger = screen.getByText('Select document type')
    await user.click(selectTrigger)
    await user.click(screen.getByText('Identity Proof'))

    // Now upload button should be visible
    await waitFor(() => {
      expect(screen.getByText('Upload Document')).toBeInTheDocument()
    })
  })

  it('respects maximum file limit', () => {
    const mockDocuments: DocumentFile[] = Array.from({ length: 5 }, (_, i) => ({
      id: `${i + 1}`,
      file: createMockFile(`test${i + 1}.pdf`, 1024, 'application/pdf'),
      documentType: 'IDENTITY_PROOF',
      uploadProgress: 100,
      status: 'success' as const
    }))

    renderWithProviders(
      <DocumentUpload 
        documents={mockDocuments} 
        onDocumentsChange={mockOnDocumentsChange}
        maxFiles={5}
      />
    )

    expect(screen.getByText('Maximum number of documents (5) reached.')).toBeInTheDocument()
    expect(screen.queryByText('Drop files here or click to browse')).not.toBeInTheDocument()
  })

  it('disables upload when disabled prop is true', () => {
    renderWithProviders(
      <DocumentUpload 
        documents={[]} 
        onDocumentsChange={mockOnDocumentsChange}
        disabled={true}
      />
    )

    const uploadArea = screen.getByText('Drop files here or click to browse').closest('div')
    expect(uploadArea).toHaveClass('opacity-50', 'cursor-not-allowed')
  })

  it('handles drag and drop events', async () => {
    renderWithProviders(
      <DocumentUpload 
        documents={[]} 
        onDocumentsChange={mockOnDocumentsChange}
      />
    )

    const uploadArea = screen.getByText('Drop files here or click to browse').closest('div')
    
    if (uploadArea) {
      // Test drag enter
      fireEvent.dragEnter(uploadArea)
      expect(uploadArea).toHaveClass('border-primary', 'bg-primary/5')

      // Test drag leave
      fireEvent.dragLeave(uploadArea)
      expect(uploadArea).not.toHaveClass('border-primary', 'bg-primary/5')

      // Test drop
      const file = createMockFile('test.pdf', 1024, 'application/pdf')
      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [file]
        }
      })

      await waitFor(() => {
        expect(mockOnDocumentsChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              file: expect.any(File),
              status: 'pending'
            })
          ])
        )
      })
    }
  })
})